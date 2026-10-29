// ====================================================================
// LearnMate AI - Premium Landing Page
// ====================================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Compass,
  FileText,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Zap,
  BookOpen,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { loginDemo } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState<'conceptual' | 'socratic' | 'beginner'>('conceptual');

  const demoResponses = {
    conceptual: {
      title: 'Conceptual Mode',
      text: 'Neural networks learn representations through backpropagation. We calculate the gradient of the loss function with respect to each weight using the calculus chain rule, propagating errors backwards through the layers to adjust parameters predictably.',
    },
    socratic: {
      title: 'Socratic Mode',
      text: 'Before we look at the weight update equations: If an output prediction is completely wrong, how would you measure "how wrong" it was, and which direction should each parameter shift to reduce that penalty?',
    },
    beginner: {
      title: 'Beginner Mode',
      text: 'Imagine adjusting the knobs on a radio to eliminate static. If turning a knob to the right makes the static louder, you know to turn it left! Backpropagation is just a smart mathematical way for a computer to find which way to turn millions of tiny knobs.',
    },
  };

  const handleDemoStart = async () => {
    await loginDemo();
    navigate('/dashboard');
  };

  const faqs = [
    {
      q: 'How does LearnMate AI differ from a generic chatbot?',
      a: 'Generic chatbots treat every prompt independently and spit out immediate answers. LearnMate AI maintains a persistent student profile with your education level, past quiz accuracy, and difficult topics. It adapts explanations across 6 specialized pedagogical modes (such as Socratic guidance, beginner analogies, or exam prep), tracks topic mastery from 0-100%, and grounds its answers directly in your uploaded notes.',
    },
    {
      q: 'How does the document upload and RAG system work?',
      a: 'You can upload your own lecture slides, textbook PDFs, or markdown notes. Our backend server extracts the text, creates semantic chunks, generates embeddings, and retrieves relevant citations whenever you ask a question. The AI clearly cites specific sections and never hallucinates content outside the document.',
    },
    {
      q: 'Are quizzes graded by AI or deterministically?',
      a: 'All objective questions (multiple choice, true/false, fill-in-the-blank) are evaluated deterministically on our server to prevent answer leakage and grading hallucinations. Completed attempts update your explainable topic mastery score in real time.',
    },
    {
      q: 'How is my private data protected?',
      a: 'LearnMate AI implements strict PostgreSQL Row Level Security (RLS) policies. Every student profile, conversation, quiz attempt, and document chunk is cryptographically isolated to that student. No student can ever view or query another student’s records.',
    },
    {
      q: 'Do I need an OpenAI API key to use LearnMate AI?',
      a: 'LearnMate AI includes an adaptive pedagogical fallback engine that allows complete local exploration of all features immediately. To connect live OpenAI models like GPT-4o-mini, simply paste your OPENAI_API_KEY into the server .env configuration file.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200/60 bg-gradient-to-b from-brand-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Next-Generation Adaptive Learning Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Your Personal AI Tutor.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-600">
              Your Pace. Your Potential.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Learn anything with an AI tutor that adapts to your goals, explains difficult concepts, and helps you build lasting understanding.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base shadow-md shadow-brand-500/20" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Learning Free
              </Button>
            </Link>
            <button onClick={handleDemoStart} className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full text-base" leftIcon={<UserCheck className="w-5 h-5" />}>
                Instant Demo Student Tour
              </Button>
            </button>
          </div>

          {/* Value Props Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 6 Adaptive Tutoring Modes</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Document-Grounded RAG</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Spaced Repetition (SM-2)</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Explainable Topic Mastery</span>
          </div>
        </div>
      </section>

      {/* Interactive AI Tutor Demonstration */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="brand" className="mb-2">Interactive Demonstration</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One Concept. Three Distinct Teaching Styles.
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              LearnMate AI doesn't just regurgitate standard answers. Toggle the mode below to see how our tutor personalizes the same concept:
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex justify-center gap-2 mb-6">
            {(['conceptual', 'socratic', 'beginner'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDemoMode(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  demoMode === mode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>

          {/* Interactive Chat Box Mock */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-subtle max-w-3xl mx-auto">
            {/* Student query */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                You
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-800 shadow-2xs">
                Can you explain how neural network backpropagation works?
              </div>
            </div>

            {/* AI Tutor response */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-brand-50/70 border border-brand-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-800 leading-relaxed shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="brand" size="sm">{demoResponses[demoMode].title}</Badge>
                </div>
                <p>{demoResponses[demoMode].text}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Ready to ask your own questions?</span>
              <Link to="/signup" className="text-brand-600 font-semibold hover:underline flex items-center gap-1">
                Open Full AI Tutor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="accent" className="mb-2">Pedagogical Architecture</Badge>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Engineered for Genuine Understanding
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A 4-step cyclical engine designed from cognitive science and mastery learning principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Personalized Onboarding</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We calibrate to your education level, field of study, daily study time, and identified difficult topics.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold text-lg mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Curriculum Roadmaps</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI generates a sequenced path of modules and lessons tailored specifically to your target completion date.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Interactive Tutoring</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive step-by-step explanations, code walkthroughs, and socratic hints grounded in your uploaded study materials.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4">
                04
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Active Recall & Mastery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Objective server-graded quizzes and SM-2 spaced repetition flashcards continuously adjust your 0-100 mastery rating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="brand" className="mb-2">Comprehensive Features</Badge>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Everything You Need to Master Any Subject
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              An all-in-one suite combining generative AI, semantic vector search, and cognitive memory algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">6 Tutoring Modes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seamlessly toggle between Beginner, Conceptual, Exam Prep, Socratic, Practical, and Revision tutoring modes.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Upload Notes & RAG Grounding</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload PDFs, notes, or syllabi. The AI extracts text, indexes embeddings, and quotes relevant excerpts with page citations.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Personalized Learning Paths</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Turn learning objectives into full modular curricula with objectives, duration estimates, and progress tracking.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Smart Quizzes & Anti-Cheat</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instant diagnostic or practice quizzes evaluated deterministically on the server with full explanations.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">SM-2 Spaced Repetition</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Active recall flashcards generated automatically from your notes or quizzes, scheduled with the proven SM-2 algorithm.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Explainable Analytics</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Evidence-based charts tracking streaks, study hours, topic mastery score distribution, and targeted recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="neutral" className="mb-2">Got Questions?</Badge>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Clear answers regarding our educational models, privacy, and system capabilities.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-slate-900 text-sm hover:text-brand-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-indigo-950 to-brand-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience Truly Adaptive Learning?
          </h2>
          <p className="mt-4 text-base text-brand-200 max-w-xl mx-auto">
            Join students who learn deeper, retain longer, and tackle difficult topics with confidence.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-brand-950 hover:bg-brand-50 shadow-lg shadow-black/20 font-bold" rightIcon={<ArrowRight className="w-5 h-5 text-brand-600" />}>
                Start Learning Free
              </Button>
            </Link>
            <button onClick={handleDemoStart}>
              <Button variant="outline" size="lg" className="border-brand-700 text-brand-100 hover:bg-brand-800/50 bg-transparent">
                Explore Demo Student Account
              </Button>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
