import { User } from '../types';

/**
 * Calculate match score between two users
 * - If User A's "Need" matches User B's "Offer", score +10
 * - If majors are same, score +5
 * @param userA First user
 * @param userB Second user
 * @returns Match score (0-100+)
 */
export function calculateMatchScore(userA: User, userB: User): number {
  let score = 0;

  // Check if User A's needs match User B's offers
  const needsMet = userA.skillsNeeded.filter(need => 
    userB.skillsOffered.includes(need)
  );
  score += needsMet.length * 10;

  // Check if User B's needs match User A's offers
  const needsMetReverse = userB.skillsNeeded.filter(need => 
    userA.skillsOffered.includes(need)
  );
  score += needsMetReverse.length * 10;

  // Check if majors match
  if (userA.major.toLowerCase() === userB.major.toLowerCase()) {
    score += 5;
  }

  return score;
}

/**
 * Calculate match percentage (normalized to 0-100)
 * Uses a simple normalization: score / maxPossibleScore * 100
 * Max possible score is roughly: (max skills * 2 * 10) + 5 = ~205 for 10 skills each
 * We'll cap it at 100% for display purposes
 */
export function calculateMatchPercentage(userA: User, userB: User): number {
  const score = calculateMatchScore(userA, userB);
  // Normalize: assuming max practical score is around 100-150, we'll use 100 as base
  const maxScore = 100;
  const percentage = Math.min((score / maxScore) * 100, 100);
  return Math.round(percentage);
}

