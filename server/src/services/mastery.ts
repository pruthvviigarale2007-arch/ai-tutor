// ====================================================================
// LearnMate AI - Adaptive Mastery & Recommendation Engine
// Transparent, explainable mastery scoring and difficulty heuristics.
// ====================================================================
import { TopicMastery } from '../types';

export interface Recommendation {
  id: string;
  type: 'revisit_foundations' | 'guided_practice' | 'intermediate_challenge' | 'advanced_application' | 'spaced_revision';
  topic: string;
  headline: string;
  reason: string;
  targetAction: string;
  priority: 'high' | 'medium' | 'low';
  currentMastery: number;
}

export class MasteryEngine {
  /**
   * Determine the pedagogical difficulty bracket based on student's current mastery score
   */
  getAdaptiveDifficulty(masteryScore: number): {
    tier: 'revisit_foundations' | 'guided_practice' | 'intermediate_challenge' | 'advanced_application';
    label: string;
    guidance: string;
  } {
    if (masteryScore < 50) {
      return {
        tier: 'revisit_foundations',
        label: 'Foundational Review (<50%)',
        guidance: 'Break down definitions, simple analogies, and core mental models before attempting tricky exercises.',
      };
    } else if (masteryScore < 70) {
      return {
        tier: 'guided_practice',
        label: 'Guided Practice (50-69%)',
        guidance: 'Work through guided step-by-step examples with progressive scaffolding and immediate hints.',
      };
    } else if (masteryScore < 85) {
      return {
        tier: 'intermediate_challenge',
        label: 'Intermediate Application (70-84%)',
        guidance: 'Solve multi-step problems, contrast alternative approaches, and handle standard edge cases.',
      };
    } else {
      return {
        tier: 'advanced_application',
        label: 'Advanced Mastery & Synthesis (85%+)',
        guidance: 'Engage in open-ended synthesis, time-pressured exam drills, and teach-back Socratic challenges.',
      };
    }
  }

  /**
   * Compute evidence-based recommendations based on student's topic mastery records
   */
  generateRecommendations(masteryList: TopicMastery[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Sort by lowest mastery first for improvement candidates
    const sorted = [...masteryList].sort((a, b) => a.mastery_score - b.mastery_score);

    for (const item of sorted) {
      const difficulty = this.getAdaptiveDifficulty(item.mastery_score);

      if (item.mastery_score < 50) {
        recommendations.push({
          id: `rec-${item.topic}-foundations`,
          type: 'revisit_foundations',
          topic: item.topic,
          headline: `Strengthen Basics in ${item.topic}`,
          reason: `Current mastery is ${item.mastery_score}% across ${item.total_attempts} attempt(s). Reviewing foundational definitions will eliminate stumbling blocks.`,
          targetAction: 'Review Lesson or Ask AI Tutor in Beginner Mode',
          priority: 'high',
          currentMastery: item.mastery_score,
        });
      } else if (item.mastery_score < 70) {
        recommendations.push({
          id: `rec-${item.topic}-practice`,
          type: 'guided_practice',
          topic: item.topic,
          headline: `Reinforce Practice for ${item.topic}`,
          reason: `You've demonstrated solid initial understanding (${item.mastery_score}%). A targeted 5-question quiz will bridge the gap to full confidence.`,
          targetAction: 'Take Guided Practice Quiz',
          priority: 'medium',
          currentMastery: item.mastery_score,
        });
      } else if (item.mastery_score >= 85) {
        recommendations.push({
          id: `rec-${item.topic}-advanced`,
          type: 'advanced_application',
          topic: item.topic,
          headline: `Maintain Mastery: ${item.topic}`,
          reason: `Outstanding performance (${item.mastery_score}%, ${item.correct_attempts}/${item.total_attempts} correct). Time for spaced retention or challenging case studies.`,
          targetAction: 'Quick Active-Recall Flashcard Session',
          priority: 'low',
          currentMastery: item.mastery_score,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-welcome',
        type: 'guided_practice',
        topic: 'Getting Started',
        headline: 'Explore Your First Learning Path',
        reason: 'Start your educational journey by taking a short diagnostic quiz or asking your AI Tutor a question.',
        targetAction: 'Generate Learning Path',
        priority: 'high',
        currentMastery: 0,
      });
    }

    return recommendations;
  }
}

export const masteryEngine = new MasteryEngine();
