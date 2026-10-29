// ====================================================================
// LearnMate AI - Intelligent AI Tutor Interactive Chat
// Core interface with 6 tutor modes, real-time streaming, RAG grounding,
// markdown code highlighting, copy, retry, and conversation history.
// ====================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, apiStreamChat } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TutorMode, Conversation, Message, StudyDocument } from '../types';

export const TutorPage: React.FC = () => {
  const { id: paramConvId } = useParams<{ id?: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | undefined>(paramConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [tutorMode, setTutorMode] = useState<TutorMode>('conceptual');
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and documents on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const [convRes, docRes] = await Promise.all([
          apiRequest('/tutor/conversations'),
          apiRequest('/documents'),
        ]);
        setConversations(convRes.conversations || []);
        setDocuments(docRes.documents || []);

        if (paramConvId) {
          await loadConversation(paramConvId);
        } else if (convRes.conversations?.length > 0) {
          // Open latest conversation
          setCurrentConvId(convRes.conversations[0].id);
          await loadConversation(convRes.conversations[0].id);
        }
      } catch (err) {
        console.error('Failed to load tutor data:', err);
      }
    }
    loadInitial();
  }, [paramConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const loadConversation = async (convId: string) => {
    try {
      const res = await apiRequest(`/tutor/conversations/${convId}`);
      if (res.conversation) {
        setCurrentConvId(convId);
        setTutorMode(res.conversation.tutor_mode);
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const startNewConversation = () => {
    setCurrentConvId(undefined);
    setMessages([]);
    setInputMessage('');
    navigate('/tutor');
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || isStreaming) return;

    setLastUserPrompt(textToSend);
    setInputMessage('');

    // Append optimistic user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConvId || '',
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    // Temporary placeholder for assistant streaming
    const tempAssistantId = `stream-${Date.now()}`;
    const tempAssistantMsg: Message = {
      id: tempAssistantId,
      conversation_id: currentConvId || '',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    try {
      await apiStreamChat(
        textToSend,
        tutorMode,
        currentConvId,
        selectedDocId,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        async (fullText, newConvId) => {
          setIsStreaming(false);
          if (newConvId && newConvId !== currentConvId) {
            setCurrentConvId(newConvId);
            // Refresh conversation list
            const convRes = await apiRequest('/tutor/conversations');
            setConversations(convRes.conversations || []);
          }
        },
        (err) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantId
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      `⚠️ Tutor note: I experienced an interruption while processing. Please check connection or click retry below. (${err.message})`,
                  }
                : msg
            )
          );
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
    }
  };

  const handleRetry = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/tutor/conversations/${convId}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConvId === convId) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const tutorModesInfo: Record<TutorMode, { label: string; desc: string; color: string }> = {
    beginner: { label: 'Beginner Mode', desc: 'Everyday analogies with zero unnecessary jargon', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    conceptual: { label: 'Conceptual Mode', desc: 'Deep dive into mechanisms and foundational why', color: 'bg-brand-50 text-brand-700 border-brand-200' },
    exam_prep: { label: 'Exam Prep Mode', desc: 'High-yield points, marking criteria & trap avoidance', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    socratic: { label: 'Socratic Mode', desc: 'Guided inquiry through progressive hints and questions', color: 'bg-accent-50 text-accent-700 border-accent-200' },
    practical: { label: 'Practical Mode', desc: 'Worked code snippets, exercises & concrete steps', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    revision: { label: 'Revision Mode', desc: 'Rapid active recall synthesis & weakness check', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const starterPrompts = [
    'Explain how neural network backpropagation works from first principles',
    'Walk me through a practical binary search tree implementation with code',
    'What is the difference between supervised and unsupervised learning?',
    'Give me a Socratic hint on how to optimize an O(n^2) algorithm',
  ];

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left Drawer / Sidebar: Conversations & Mode Filter */}
      <div className="hidden lg:flex w-72 flex-col bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversations</h3>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs py-1 px-2.5 h-8 gap-1"
            onClick={startNewConversation}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Chat
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {conversations.length > 0 ? (
            conversations.map((c) => {
              const isActive = c.id === currentConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 font-semibold border border-brand-200/60'
                      : 'text-slate-700 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bot className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations yet. Ask your first question!
            </div>
          )}
        </div>

        {/* RAG Grounding Note */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
            <FileText className="w-3 h-3 text-brand-600" /> Ground in Study Material
          </label>
          <select
            value={selectedDocId || ''}
            onChange={(e) => setSelectedDocId(e.target.value || undefined)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">None (General AI Knowledge)</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                📄 {d.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        {/* Top Chat Bar: Mode Selector & Active Info */}
        <div className="p-3 sm:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          {/* Mode Pill Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {(['conceptual', 'socratic', 'beginner', 'exam_prep', 'practical', 'revision'] as TutorMode[]).map(
              (mode) => {
                const info = tutorModesInfo[mode];
                const isSelected = tutorMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setTutorMode(mode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? `${info.color} shadow-2xs font-bold ring-1 ring-brand-500`
                        : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                    title={info.desc}
                  >
                    {info.label.replace(' Mode', '')}
                  </button>
                );
              }
            )}
          </div>

          {/* Quick RAG indicator badge */}
          {selectedDocId && (
            <Badge variant="accent" size="sm" className="hidden sm:inline-flex gap-1">
              <FileText className="w-3 h-3" /> Grounded in doc
            </Badge>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4 animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Hello {profile?.display_name || 'Learner'}, I'm your AI Tutor.
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                I adapt to your knowledge level, pacing, and learning style. Select a mode above or try one of these prompts:
              </p>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 gap-2 mt-6 w-full text-left">
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-brand-50 hover:border-brand-200 text-xs text-slate-700 hover:text-brand-900 transition-all flex items-center justify-between group"
                  >
                    <span>{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-brand-600 to-accent-500 text-white shadow-xs'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-50 border border-slate-200/80 text-slate-900 shadow-2xs'
                        : 'bg-brand-600 text-white rounded-tr-none'
                    }`}
                  >
                    {isAssistant ? (
                      <div className="prose prose-sm max-w-none text-slate-900 dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>

                        {/* Grounded Document Sources Citation Bar */}
                        {m.metadata?.sources && m.metadata.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">Citations: </span>
                            {m.metadata.sources.map((s, idx) => (
                              <span key={idx} className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 mr-1.5 text-brand-700">
                                📄 {s.filename} {s.page ? `(p. ${s.page})` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Message Action Footer */}
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[10px]">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="hover:text-slate-700 p-1 rounded transition-colors"
                              title="Copy explanation"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={handleRetry}
                              className="hover:text-slate-700 p-1 rounded transition-colors"
                              title="Regenerate / Retry"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              placeholder={`Ask in ${tutorModesInfo[tutorMode].label}... (Press Enter to send)`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              isLoading={isStreaming}
              className="px-5 py-3 rounded-xl shadow-xs"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Mode: {tutorModesInfo[tutorMode].label}</span>
            <span>AI responses are structured for verified understanding.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
