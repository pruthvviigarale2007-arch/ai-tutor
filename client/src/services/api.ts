// ====================================================================
// LearnMate AI - Client HTTP API Layer
// Centralized fetch wrapper with automatic auth token injection.
// ====================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem('learnmate_auth_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while communicating with the server.';
    let details: any = undefined;
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errJson.error || errorMessage;
      details = errJson.details;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status, details);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Upload file using multipart/form-data with auth token
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'File upload failed.';
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

/**
 * Stream tutor response using SSE
 */
export async function apiStreamChat(
  message: string,
  tutorMode: string,
  conversationId?: string,
  documentId?: string,
  onChunk?: (chunk: string) => void,
  onDone?: (fullText: string, convId: string) => void,
  onError?: (err: Error) => void
): Promise<void> {
  const token = getStoredToken();
  const url = `${BASE_URL}/tutor/chat?stream=true`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        tutorMode,
        conversationId,
        documentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response body is unavailable');
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let finalConvId = conversationId || '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              accumulated += data.chunk;
              onChunk?.(data.chunk);
            }
            if (data.conversationId) {
              finalConvId = data.conversationId;
            }
            if (data.done) {
              onDone?.(accumulated, finalConvId);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Partial JSON chunk line or keep-alive
          }
        }
      }
    }
  } catch (err: any) {
    onError?.(err);
  }
}
