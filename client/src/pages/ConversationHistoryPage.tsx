// ====================================================================
// LearnMate AI - Conversation History Page
// ====================================================================
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Trash2, ArrowRight, Clock, Plus, Sparkles } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Conversation } from '../types';

export const ConversationHistoryPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest('/tutor/conversations');
        setConversations(res.conversations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/tutor/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conversation History</h1>
          <p className="text-xs text-slate-500 mt-1">Review past tutoring sessions, inquiries, and explanations</p>
        </div>
        <Link to="/tutor">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New Tutoring Session</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {conversations.length > 0 ? (
          conversations.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate(`/tutor/${c.id}`)}
              className="p-4 cursor-pointer hover:border-brand-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="brand" size="sm">{c.tutor_mode}</Badge>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.updated_at).toLocaleDateString()} at{' '}
                      {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(c.id, e)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No saved conversations yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Start your first discussion with the AI Tutor.</p>
            <Link to="/tutor">
              <Button size="sm">Start a Conversation</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
