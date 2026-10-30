// ====================================================================
// LearnMate AI - Dedicated Standalone AI Chatbot Page
// Full-screen interactive learning chatbot with 6 modes, voice input,
// speech synthesis, category prompts, and instant accessibility without barriers.
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
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ArrowRight,
  BookOpen,
  Download,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiStreamChat } from '../services/api';
import { TutorMode } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('learnmate_public_chatbot_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'intro',
        role: 'assistant',
        content: `👋 **Welcome to LearnMate AI Chatbot!**\n\nI am your adaptive personal learning assistant. I don't just dump answers—I help you genuinely understand difficult topics.\n\n### How to get the most out of our session:
1. **Pick a Tutor Mode** on the left (Conceptual, Socratic, Beginner, Exam Prep, Practical, or Revision).
2. **Type or speak** any question or homework problem.
3. Use the **audio speaker button** to listen to explanations aloud!`,
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

  useEffect(() => {
    localStorage.setItem('learnmate_public_chatbot_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

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

  // Text-to-Speech (TTS)
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
          id: 'intro',
          role: 'assistant',
          content: `Chat session reset. What topic would you like to explore?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const exportChat = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n\n---\n`)
      .join('\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnmate-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tutorModesInfo: Record<TutorMode, { label: string; desc: string; badge: string }> = {
    conceptual: {
      label: 'Conceptual Mode',
      desc: 'First-principles breakdown explaining mechanism, intuition, and why.',
      badge: 'Deep Understanding',
    },
    socratic: {
      label: 'Socratic Mode',
      desc: 'Never reveals answers right away; guides you through hints & inquiry.',
      badge: 'Active Thinking',
    },
    beginner: {
      label: 'Beginner Mode',
      desc: 'Everyday analogies with zero confusing jargon. Simple and intuitive.',
      badge: 'Simple Language',
    },
    exam_prep: {
      label: 'Exam Prep Mode',
      desc: 'High-yield points, examiner marking criteria, and common trick traps.',
      badge: 'High Yield',
    },
    practical: {
      label: 'Practical Mode',
      desc: 'Step-by-step worked solutions, code snippets, and live exercises.',
      badge: 'Code & Applied',
    },
    revision: {
      label: 'Revision Mode',
      desc: 'Rapid memory tests, flash-recall prompts, and topic synthesis.',
      badge: 'Rapid Recall',
    },
  };

  const starterTopics = [
    { title: 'Neural Network Backpropagation', prompt: 'Explain how backpropagation works step-by-step from first principles.' },
    { title: 'Binary Search Tree Balancing', prompt: 'Walk me through why an AVL tree needs rotations with code examples.' },
    { title: 'Socratic Prompt: Big-O Complexity', prompt: 'Give me a Socratic hint on how to analyze the time complexity of recursive Fibonacci.' },
    { title: 'DNA Replication vs Transcription', prompt: 'What are the fundamental differences between DNA replication and RNA transcription?' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Tutor Mode Switcher & Category Prompts */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Teaching Mode</h3>
              </div>
              <Badge variant="brand" size="sm">{tutorModesInfo[tutorMode].badge}</Badge>
            </div>

            <div className="space-y-1.5">
              {(Object.keys(tutorModesInfo) as TutorMode[]).map((mode) => {
                const info = tutorModesInfo[mode];
                const isSelected = tutorMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setTutorMode(mode)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/80 text-brand-950 shadow-2xs ring-1 ring-brand-500'
                        : 'border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{info.label}</span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-brand-600"></span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Starters */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle space-y-3 hidden sm:block">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sample Prompts
            </h4>
            <div className="space-y-2">
              {starterTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/70 hover:border-brand-300 hover:bg-brand-50/40 text-[11px] text-slate-700 hover:text-brand-900 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Unlock Full Platform Card */}
          <div className="bg-gradient-to-tr from-brand-900 to-indigo-950 text-white rounded-3xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-300" />
              <h4 className="text-xs font-bold">Want Full Roadmaps & Quizzes?</h4>
            </div>
            <p className="text-[11px] text-brand-200 leading-relaxed">
              Create a free account to track 0–100 topic mastery, upload PDFs with RAG citations, and schedule spaced repetition.
            </p>
            <Link to="/signup" className="block">
              <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-brand-50 font-bold text-xs">
                Create Free Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Chat Thread Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col h-[750px] max-h-[82vh] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">LearnMate AI Tutor</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Mode: <span className="font-semibold text-slate-700">{tutorModesInfo[tutorMode].label}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={exportChat}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Download Conversation Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/20">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-brand-600 to-accent-500 text-white shadow-xs'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-white border border-slate-200/90 text-slate-900 shadow-2xs'
                        : 'bg-brand-600 text-white rounded-tr-none'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none text-inherit">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    {isAssistant && m.content && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px]">{m.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakText(m.content, m.id)}
                            className="p-1 hover:text-brand-600 rounded transition-colors"
                            title={isSpeaking === m.id ? 'Stop readout' : 'Read aloud with voice'}
                          >
                            {isSpeaking === m.id ? (
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

          {/* Input & Voice Controls */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl border transition-colors ${
                  isListening
                    ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice Input (Speech-to-Text)'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? 'Listening to your voice...' : `Ask anything in ${tutorModesInfo[tutorMode].label}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isStreaming}
                className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
              />

              <Button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                isLoading={isStreaming}
                className="px-5 py-3 rounded-2xl"
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
