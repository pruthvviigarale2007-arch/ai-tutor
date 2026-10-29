// ====================================================================
// LearnMate AI - Interactive Quiz Taker Interface
// One question at a time, progress bar, anti-cheat safe
// ====================================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Quiz, QuizClientQuestion } from '../types';

export const QuizTakerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await apiRequest(`/quizzes/${id}`);
        setQuiz(res.quiz || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Preparing assessment environment...
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-20 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Unable to load quiz</h3>
        <p className="text-xs text-slate-500">{error || 'Quiz not found'}</p>
        <Button onClick={() => navigate('/quizzes')} variant="secondary">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  const currentQ: QuizClientQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const currentSelection = userAnswers[currentQ.id] || '';

  const handleSelectAnswer = (ans: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: ans }));
  };

  const handleSubmit = async () => {
    // Check if any questions unanswered
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < totalQuestions) {
      if (!window.confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedAnswer: userAnswers[q.id] || '',
        })),
      };

      const res = await apiRequest(`/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Navigate to results page with attempt data
      navigate(`/quizzes/${quiz.id}/results`, { state: { attempt: res.attempt } });
    } catch (err: any) {
      alert(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <Badge variant="brand" size="sm">{quiz.topic}</Badge>
          <h2 className="text-lg font-bold text-slate-900 mt-1">{quiz.title}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-600 block">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-[10px] text-slate-400 capitalize">{quiz.difficulty} Difficulty</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-brand-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-2">
            Question {currentIndex + 1}
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options / Input based on question type */}
        <div className="space-y-3">
          {currentQ.type === 'multiple_choice' || currentQ.type === 'true_false' ? (
            (currentQ.options || []).map((opt, optIdx) => {
              const isSelected = currentSelection === opt;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(opt)}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 text-brand-950 font-semibold ring-1 ring-brand-500 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">
                Type your answer below:
              </label>
              <input
                type="text"
                placeholder="Enter your exact answer..."
                value={currentSelection}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next Question
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Assessment
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
