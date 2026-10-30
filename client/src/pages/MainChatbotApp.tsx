// ====================================================================
// LearnMate AI - Main Standalone AI Tutor Chatbot Interface
// A modern, distraction-free conversational AI tutor (ChatGPT/Claude style)
// featuring 6 pedagogical modes, real-time streaming, voice dictation,
// speech synthesis, document grounding, and chat persistence.
// ====================================================================
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Plus,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Menu,
  X,
  Trash2,
  Paperclip,
  Download,
  BookOpen,
  Award,
  Zap,
  Calendar,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { apiStreamChat, apiUpload } from '../services/api';
import { TutorMode } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  mode: TutorMode;
  messages: Message[];
  updatedAt: string;
}

export const MainChatbotApp: React.FC = () => {
  // State for sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('learnmate_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback
      }
    }
    const initialSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Discussion',
      mode: 'conceptual',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session_' + Date.now();
  });

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>(
    activeSession?.mode || 'conceptual'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem('learnmate_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Sync mode with active session
  useEffect(() => {
    if (activeSession) {
      setTutorMode(activeSession.mode);
    }
  }, [activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isStreaming]);

  // Update mode
  const handleModeChange = (newMode: TutorMode) => {
    setTutorMode(newMode);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, mode: newMode } : s))
    );
  };

  // Create new chat
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Discussion',
      mode: tutorMode,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
    setAttachedDocName(null);
    setIsSidebarOpen(false);
  };

  // Delete chat session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Copy message
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to Speech
  const toggleSpeech = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Speech to Text (Microphone)
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your prompt.');
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

  // Handle File Upload for Document Grounding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiUpload('/documents/upload', formData);
      setAttachedDocName(file.name);
    } catch {
      setAttachedDocName(file.name);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send Message
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputMessage).trim();
    if (!textToSend || isStreaming) return;

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `a-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: attachedDocName ? [attachedDocName] : undefined,
    };

    // Update active session messages
    const currentMessages = activeSession?.messages || [];
    const updatedMessages = [...currentMessages, userMessage, assistantPlaceholder];

    // Determine smart title if first message
    const newTitle =
      currentMessages.length === 0
        ? textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '')
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );

    setIsStreaming(true);

    try {
      await apiStreamChat(
        textToSend,
        tutorMode,
        activeSessionId,
        undefined,
        (chunk) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeSessionId) return s;
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
              );
              return { ...s, messages: msgs };
            })
          );
        },
        (fullText) => {
          setIsStreaming(false);
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeSessionId) return s;
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: fullText } : m
              );
              return { ...s, messages: msgs };
            })
          );
        },
        (err) => {
          setIsStreaming(false);
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeSessionId) return s;
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        `⚠️ Note: Connection interrupted. Please try again or rephrase your question. (${err.message})`,
                    }
                  : m
              );
              return { ...s, messages: msgs };
            })
          );
        }
      );
    } catch {
      setIsStreaming(false);
    }
  };

  // Download Transcript
  const handleDownloadTranscript = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    const text = activeSession.messages
      .map(
        (m) =>
          `### [${m.timestamp}] ${m.role === 'user' ? '👤 Learner' : '🤖 AI Tutor'}\n\n${m.content}\n\n---\n`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tutorModesInfo: Record<
    TutorMode,
    { label: string; desc: string; badge: string; color: string }
  > = {
    conceptual: {
      label: 'Conceptual',
      desc: 'First-principles breakdown explaining mechanism, intuition, and why.',
      badge: 'Deep Understanding',
      color: 'bg-brand-50 text-brand-700 border-brand-200',
    },
    socratic: {
      label: 'Socratic',
      desc: 'Never reveals answers right away; guides you through hints & inquiry.',
      badge: 'Active Thinking',
      color: 'bg-accent-50 text-accent-700 border-accent-200',
    },
    beginner: {
      label: 'Beginner',
      desc: 'Everyday analogies with zero confusing jargon. Simple and warm.',
      badge: 'Simple Language',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    exam_prep: {
      label: 'Exam Prep',
      desc: 'High-yield points, examiner marking criteria, and common trick traps.',
      badge: 'High Yield',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    practical: {
      label: 'Practical',
      desc: 'Step-by-step worked solutions, code snippets, and hands-on exercises.',
      badge: 'Code & Applied',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    revision: {
      label: 'Revision',
      desc: 'Rapid memory tests, flash-recall prompts, and topic synthesis.',
      badge: 'Rapid Recall',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  };

  const starterCards = [
    {
      title: '🧠 Explain Backpropagation',
      desc: 'Break down how neural networks learn with intuitive calculus chain rule.',
      prompt: 'Explain how neural network backpropagation works from first principles with a simple analogy.',
    },
    {
      title: '❓ Socratic Hint: Recursion',
      desc: 'Guide me to solve a recursive problem without giving me the answer.',
      prompt: 'Give me a Socratic hint on how to design the base case and recursive step for reversing a linked list.',
    },
    {
      title: '📝 High-Yield Exam Checklist',
      desc: 'Examiner criteria, marking points, and traps for any topic.',
      prompt: 'Give me a concise 4-mark model answer outline for how DNS resolution works.',
    },
    {
      title: '💻 Practical Code Example',
      desc: 'Demonstrate a clean, typed implementation with step-by-step comments.',
      prompt: 'Show me a practical TypeScript implementation of a LRU Cache with step-by-step explanation.',
    },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand & New Chat */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  LearnMate <span className="text-brand-600">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block uppercase -mt-0.5">
                  Adaptive Tutor Chatbot
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Middle: Chat History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Chat History
          </span>
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200/60'
                    : 'text-slate-600 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{s.title || 'Discussion'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom: Teaching Modes & Quick Tools */}
        <div className="p-3 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              Select Teaching Mode
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(tutorModesInfo) as TutorMode[]).map((m) => {
                const info = tutorModesInfo[m];
                const isSelected = tutorMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    title={info.desc}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick link to practice & flashcards */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <Link
              to="/quizzes"
              className="hover:text-brand-600 font-medium flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" /> Quizzes
            </Link>
            <Link
              to="/flashcards"
              className="hover:text-brand-600 font-medium flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500" /> Flashcards
            </Link>
            <Link
              to="/dashboard"
              className="hover:text-brand-600 font-medium flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> More
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">LearnMate AI</span>
              <span className="hidden sm:inline-block text-slate-300">•</span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  tutorModesInfo[tutorMode].color
                }`}
              >
                {tutorModesInfo[tutorMode].label} Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attachedDocName && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                {attachedDocName}
                <button
                  onClick={() => setAttachedDocName(null)}
                  className="hover:text-rose-600 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleDownloadTranscript}
              disabled={!activeSession?.messages?.length}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Export Conversation Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Start Fresh Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <Link to="/dashboard" className="hidden sm:inline-flex">
              <button className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors">
                Dashboard
              </button>
            </Link>
          </div>
        </header>

        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {(!activeSession?.messages || activeSession.messages.length === 0) ? (
            /* Empty State: Greeting & Starter Cards */
            <div className="max-w-3xl mx-auto py-8 sm:py-14 space-y-8 animate-fade-in text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-brand-500/20 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  What would you like to learn today?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                  I adapt my explanations to your pace, test for understanding, and break down complex concepts into crystal-clear steps.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
                {starterCards.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-brand-400 hover:bg-brand-50/30 shadow-subtle hover:shadow-card transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-[11px] font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                      <span>Ask question</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((m) => {
                const isAssistant = m.role === 'assistant';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 sm:gap-4 ${
                      isAssistant ? '' : 'flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAssistant
                          ? 'bg-gradient-to-tr from-brand-600 to-accent-500 text-white shadow-md shadow-brand-500/20'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs'
                          : 'bg-brand-600 text-white rounded-tr-none'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none text-inherit leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>

                      {/* Document Citations if any */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-brand-600" />
                          <span className="font-semibold text-slate-700">Source:</span>
                          <span className="italic">{m.sources.join(', ')}</span>
                        </div>
                      )}

                      {/* Footer Actions on Assistant message */}
                      {isAssistant && m.content && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[10px]">{m.timestamp}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSpeech(m.content, m.id)}
                              className="p-1 hover:text-brand-600 rounded transition-colors"
                              title={isSpeakingId === m.id ? 'Stop readout' : 'Read aloud with voice'}
                            >
                              {isSpeakingId === m.id ? (
                                <VolumeX className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="p-1 hover:text-brand-600 rounded transition-colors"
                              title="Copy response"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
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
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200/80 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 shadow-xs transition-all"
            >
              {/* File Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="doc-attachment"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors shrink-0"
                title={attachedDocName ? `Attached: ${attachedDocName}` : 'Attach PDF, notes, or code to ground tutor'}
              >
                <Paperclip className={`w-4 h-4 ${attachedDocName ? 'text-brand-600' : ''}`} />
              </button>

              {/* Voice Input Microphone */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                  isListening
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice Input (Speech-to-Text)'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Input Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isListening
                    ? 'Listening to your voice...'
                    : `Ask in ${tutorModesInfo[tutorMode].label} mode... (Enter to send, Shift+Enter for new line)`
                }
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isStreaming}
                className="flex-1 max-h-32 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none px-2 py-2"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-sm transition-all shrink-0 active:scale-95"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Teaching Mode: <strong className="text-slate-600">{tutorModesInfo[tutorMode].label}</strong></span>
              <span>LearnMate AI is calibrated to verify deep understanding.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
