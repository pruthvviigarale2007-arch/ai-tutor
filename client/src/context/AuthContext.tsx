// ====================================================================
// LearnMate AI - Authentication Context & Provider
// Supports Supabase Auth & Instant Demo Student Mode
// ====================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { apiRequest } from '../services/api';
import { UserProfile } from '../types';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  loginDemo: (studentId?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('learnmate_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('learnmate_auth_token');

        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser({ id: session.user.id, email: session.user.email });
            setToken(session.access_token);
            localStorage.setItem('learnmate_auth_token', session.access_token);
            await fetchProfile(session.access_token);
            setIsLoading(false);
            return;
          }
        }

        if (storedToken) {
          // Verify with backend
          try {
            const data = await apiRequest<{ profile: UserProfile }>('/profile');
            if (data?.profile) {
              setProfile(data.profile);
              setUser({ id: data.profile.id, email: `${data.profile.display_name.toLowerCase().replace(/\s+/g, '')}@learnmate.ai` });
            }
          } catch (err) {
            console.warn('Session expired or invalid, clearing:', err);
            localStorage.removeItem('learnmate_auth_token');
            setToken(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (e) {
        console.error('Failed to initialize auth:', e);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  async function fetchProfile(authToken?: string): Promise<UserProfile | null> {
    try {
      const res = await apiRequest<{ profile: UserProfile }>('/profile', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res?.profile) {
        setProfile(res.profile);
        return res.profile;
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
    return null;
  }

  async function login(email: string, password: string): Promise<void> {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          setUser({ id: data.session.user.id, email: data.session.user.email });
          setToken(data.session.access_token);
          localStorage.setItem('learnmate_auth_token', data.session.access_token);
          await fetchProfile(data.session.access_token);
          return;
        }
      }

      // Local/offline fallback authentication
      const studentId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      setToken(studentId);
      localStorage.setItem('learnmate_auth_token', studentId);
      setUser({ id: studentId, email });
      const p = await fetchProfile(studentId);
      if (!p) {
        // Create initial profile
        const updated = await apiRequest<{ profile: UserProfile }>('/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            display_name: email.split('@')[0],
            education_level: 'undergraduate',
            field_of_study: 'General Studies',
            subjects_of_interest: ['General Science', 'Problem Solving'],
            current_knowledge_level: 'intermediate',
            learning_goals: ['Build deeper understanding'],
            preferred_language: 'en',
            daily_study_minutes: 30,
          }),
        });
        setProfile(updated.profile);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signup(email: string, password: string, displayName?: string): Promise<void> {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName || email.split('@')[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          setUser({ id: data.session.user.id, email: data.session.user.email });
          setToken(data.session.access_token);
          localStorage.setItem('learnmate_auth_token', data.session.access_token);
          await fetchProfile(data.session.access_token);
          return;
        }
      }

      // Local fallback signup
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginDemo(studentId: string = 'demo-student-alex'): Promise<void> {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: { id: string; email: string }; profile: UserProfile }>(
        '/auth/demo-session',
        {
          method: 'POST',
          body: JSON.stringify({ userId: studentId }),
        }
      );

      setToken(res.token);
      localStorage.setItem('learnmate_auth_token', res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('learnmate_auth_token');
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(email: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } else {
      // Mock reset notification
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  async function refreshProfile(): Promise<UserProfile | null> {
    return fetchProfile();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        signup,
        loginDemo,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
