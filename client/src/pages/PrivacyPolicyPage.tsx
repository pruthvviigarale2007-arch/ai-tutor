// ====================================================================
// LearnMate AI - Privacy & Security Policy
// ====================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to LearnMate AI
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-subtle space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Privacy Policy & Data Security</h1>
            <p className="text-xs text-slate-500">Effective Date: October 2026 • LearnMate AI Platform</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" /> 1. Principles of Student Privacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            At LearnMate AI, we believe education is deeply personal. Your questions, misconceptions, quiz scores, and uploaded study notes should never be exposed, monetized, or shared with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> 2. PostgreSQL Row Level Security (RLS)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All student data is guarded by database-level Row Level Security (RLS) policies. Authenticated session tokens are cryptographically verified before every single query. It is mathematically and architecturally impossible for one student to view, query, or modify another student's conversations, study documents, or progress records.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-indigo-600" /> 3. Uploaded Study Materials & RAG Grounding
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            When you upload PDF textbooks or notes, text extraction and embeddings are generated strictly to provide grounded answers to your own prompts. Your uploaded materials are never added to public training corpora or accessed by other accounts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" /> 4. Data Deletion & Right to Be Forgotten
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You retain 100% ownership of your learning data. You can delete individual conversations, uploaded study documents, or your entire student profile at any time directly through the Settings page.
          </p>
        </section>
      </div>
    </div>
  );
};
