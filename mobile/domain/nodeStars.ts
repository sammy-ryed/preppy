// Rate the committed combined aptitude/DSA score, never XP or initial mastery.
export function nodeStars(score: number | null | undefined): number {
  if (score == null || !Number.isFinite(score) || score < 0 || score > 100) return 0;
  return score >= 85 ? 3 : score >= 60 ? 2 : 1;
}
