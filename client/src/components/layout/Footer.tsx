import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">LearnMate AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              An intelligent, adaptive educational tutor that behaves like a patient personal teacher. Personalized for your goals and learning style.
            </p>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/tutor" className="hover:text-brand-600">Adaptive AI Tutor</Link></li>
              <li><Link to="/learning-paths" className="hover:text-brand-600">Roadmap Generator</Link></li>
              <li><Link to="/materials" className="hover:text-brand-600">Document Grounding (RAG)</Link></li>
              <li><Link to="/flashcards" className="hover:text-brand-600">Active Recall Flashcards</Link></li>
            </ul>
          </div>

          {/* Tutor Modes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Tutor Modes</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><span className="text-slate-700">Beginner Mode</span> - Simple analogies</li>
              <li><span className="text-slate-700">Conceptual Mode</span> - Deep mechanisms</li>
              <li><span className="text-slate-700">Socratic Mode</span> - Guided discovery</li>
              <li><span className="text-slate-700">Exam Prep</span> - High-yield recall</li>
            </ul>
          </div>

          {/* Security & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Trust & Security</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/privacy" className="hover:text-brand-600">Privacy & Data Isolation</Link></li>
              <li><span className="text-slate-500">Row-Level Security (RLS)</span></li>
              <li><span className="text-slate-500">Zero Public Data Exposure</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LearnMate AI. Built for genuine, lasting understanding.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for lifelong learners.
          </p>
        </div>
      </div>
    </footer>
  );
};
