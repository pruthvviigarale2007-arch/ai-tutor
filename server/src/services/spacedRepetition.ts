// ====================================================================
// LearnMate AI - Spaced Repetition Engine (SM-2 Modular Algorithm)
// ====================================================================

export interface ReviewCalculation {
  nextReviewAt: string;
  reviewInterval: number; // in days
  easeFactor: number;
  reviewCount: number;
}

export class SpacedRepetitionService {
  /**
   * Calculate next review interval based on SM-2 spaced repetition principles.
   * Rating:
   *   - 'easy': smooth recall, increase interval significantly
   *   - 'medium': acceptable recall with hesitation, moderate increment
   *   - 'hard': failure or high friction, reset interval to 1 day
   */
  calculateNextReview(
    currentInterval: number,
    currentEaseFactor: number,
    currentReviewCount: number,
    rating: 'easy' | 'medium' | 'hard'
  ): ReviewCalculation {
    let easeFactor = currentEaseFactor || 2.5;
    let interval = currentInterval || 1;
    let count = (currentReviewCount || 0) + 1;

    // Convert rating to grade (0-5 scale in SM-2)
    // hard -> 2 (repetition fail)
    // medium -> 3 (pass with serious effort)
    // easy -> 5 (perfect recall)
    const grade = rating === 'easy' ? 5 : rating === 'medium' ? 3 : 2;

    // Adjust ease factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3; // Minimum ease threshold

    if (grade < 3) {
      // Failed recall: reset repetition count and interval
      count = 0;
      interval = 1;
    } else {
      if (count === 1) {
        interval = 1;
      } else if (count === 2) {
        interval = rating === 'easy' ? 6 : 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    return {
      nextReviewAt: nextDate.toISOString(),
      reviewInterval: interval,
      easeFactor: Number(easeFactor.toFixed(2)),
      reviewCount: count,
    };
  }
}

export const spacedRepetition = new SpacedRepetitionService();
