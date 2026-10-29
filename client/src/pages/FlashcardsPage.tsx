// ====================================================================
// LearnMate AI - Active Recall Flashcards & Spaced Repetition (SM-2)
// ====================================================================
import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Flashcard } from '../types';

export const FlashcardsPage: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generator modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('Data Structures');
  const [cardCount, setCardCount] = useState(6);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/flashcards');
      setFlashcards(res.flashcards || []);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard: Flashcard | undefined = flashcards[currentIndex];

  const handleReview = async (rating: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;

    try {
      await apiRequest(`/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      });

      // Move to next card and unflip
      setIsFlipped(false);
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Reset to beginning or reload
        setCurrentIndex(0);
        await loadFlashcards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setIsGenerating(true);
    try {
      await apiRequest('/flashcards/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          count: Number(cardCount),
          sourceType: 'topic',
        }),
      });

      setIsModalOpen(false);
      setTopic('');
      await loadFlashcards();
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      alert(err.message || 'Flashcard generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/flashcards/${cardId}`, { method: 'DELETE' });
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
      if (currentIndex >= flashcards.length - 1) {
        setCurrentIndex(Math.max(0, flashcards.length - 2));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date();
  const dueCount = flashcards.filter((f) => new Date(f.next_review_at) <= now).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Recall Flashcards</h1>
          <p className="text-xs text-slate-500 mt-1">
            Strengthen long-term retention using the SM-2 spaced repetition algorithm
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Generate Deck
        </Button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Cards</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{flashcards.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase">Due for Review</span>
          <p className="text-2xl font-bold text-brand-600 mt-1">{dueCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Deck</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {flashcards.length > 0 ? `${currentIndex + 1}/${flashcards.length}` : '0'}
          </p>
        </Card>
      </div>

      {/* Interactive 3D Flip Card */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-hover cursor-pointer p-8 flex flex-col justify-between transition-all select-none group"
          >
            <div className="flex items-center justify-between">
              <Badge variant="brand" size="sm">{currentCard.topic}</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-brand-600 transition-colors">
                <RotateCw className="w-3.5 h-3.5" /> Click to flip
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                {isFlipped ? 'Answer (Back)' : 'Prompt / Question (Front)'}
              </span>
              <p
                className={`text-slate-900 font-semibold leading-relaxed transition-all ${
                  isFlipped ? 'text-sm sm:text-base text-brand-950 font-normal' : 'text-base sm:text-lg'
                }`}
              >
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              <span>Interval: {currentCard.review_interval} day(s)</span>
              <button
                onClick={(e) => handleDelete(currentCard.id, e)}
                className="hover:text-rose-600 p-1"
                title="Delete card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SM-2 Rating Controls (Shown when card is flipped) */}
          {isFlipped && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 animate-fade-in">
              <p className="text-center text-xs font-semibold text-slate-600">
                How easy was it to recall this concept? (Calibrates next review interval)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => handleReview('hard')}
                >
                  Hard (Reset)
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => handleReview('medium')}
                >
                  Medium (+3d)
                </Button>
                <Button
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleReview('easy')}
                >
                  Easy (+6d)
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Flashcards Generated Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Create high-yield active-recall cards from any topic or your uploaded notes.
          </p>
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Sparkles className="w-4 h-4" />}>
            Generate Flashcard Deck
          </Button>
        </div>
      )}

      {/* Generator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate AI Active-Recall Flashcards"
        description="Creates atomic question & answer pairs calibrated for spaced repetition"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <Input
            label="Topic to Extract"
            placeholder="e.g. Memory Hierarchy, Sorting Complexities, Mitosis"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Deck Size: {cardCount} cards
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="w-full accent-brand-600 mt-1"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isGenerating} leftIcon={<Sparkles className="w-4 h-4" />}>
              Generate Cards
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
