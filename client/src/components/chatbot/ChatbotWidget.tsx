// ====================================================================
// LearnMate AI - Global Floating Chatbot Widget
// Persistent, responsive floating AI tutor assistant available across all pages
// with 6 tutor modes, real-time streaming, voice dictation, and speech synthesis.
// ====================================================================
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Maximize2,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { apiStreamChat } from '../../services/api';
import { TutorMode } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ChatbotWidget: React.FC = () => {
  const location = useLocation();

  // Hide widget on full-screen chatbot views to avoid duplicate interfaces
  if (['/', '/chat', '/chatbot'].includes(location.pathname)) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('learnmate_widget_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your **LearnMate AI Chatbot**.\n\nAsk me any concept, equation, or homework question. You can switch my teaching style using the mode selector at the top!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>('conceptual');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to local storage
  useEffect(() => {
    localStorage.setItem('learnmate_widget_messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, isOpen]);

  // Speech Recognition (Speech-to-Text)
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-Speech (Read aloud)
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputMessage).trim();
    if (!textToSend || isStreaming) return;

    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const streamMsgId = `a-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: streamMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);

    try {
      await apiStreamChat(
        textToSend,
        tutorMode,
        undefined,
        undefined,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        (fullText) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamMsgId ? { ...msg, content: fullText } : msg
            )
          );
        },
        (err) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamMsgId
                ? {
                    ...msg,
                    content: `⚠️ Note: Connection interrupted. Please try again or check settings. (${err.message})`,
                  }
                : msg
            )
          );
        }
      );
    } catch {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear your conversation?')) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Chat cleared! Ask me anything to start fresh.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const quickPrompts = [
    'Explain Backpropagation',
    'Socratic Hint on Recursion',
    'Exam Prep Checklist',
    'Practical Code Demo',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-600 text-white shadow-xl shadow-brand-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          title="Open AI Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">AI Chatbot</span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-accent-950 text-white p-3.5 sm:px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold leading-tight">LearnMate AI</h3>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-brand-200/80">Adaptive Personal Tutor</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <Link
                to="/chat"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                title="Open in Full Screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                }}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                title="Close Chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Strip */}
          <div className="bg-slate-50 border-b border-slate-200/70 px-3 py-1.5 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[9px] shrink-0">Mode:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['conceptual', 'socratic', 'beginner', 'exam_prep', 'practical', 'revision'] as TutorMode[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setTutorMode(m)}
                    className={`px-2 py-0.5 rounded-lg capitalize whitespace-nowrap text-[10px] font-semibold transition-all ${
                      tutorMode === m
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/40">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] ${
                      isAssistant
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isAssistant ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      isAssistant
                        ? 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs'
                        : 'bg-brand-600 text-white'
                    }`}
                  >
                    <div className="prose prose-xs max-w-none text-inherit">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    {isAssistant && m.content && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{m.timestamp}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => speakText(m.content, m.id)}
                            className="hover:text-brand-600 p-0.5 rounded"
                            title={isSpeaking === m.id ? 'Stop reading' : 'Read aloud'}
                          >
                            {isSpeaking === m.id ? (
                              <VolumeX className="w-3 h-3 text-brand-600 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(m.content, m.id)}
                            className="hover:text-brand-600 p-0.5 rounded"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-600">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 whitespace-nowrap transition-colors border border-slate-200/60"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl border transition-colors ${
                  isListening
                    ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse'
                    : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice input'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Ask your tutor a question...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isStreaming}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-xs transition-all"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
