/**
 * Elo Rating System
 * K-factor: 32 (標準的な値)
 */

const K_FACTOR = 32;
const INITIAL_RATING = 1500;

/**
 * 期待勝率を計算
 * @param ratingA プレイヤーAのレーティング
 * @param ratingB プレイヤーBのレーティング
 * @returns プレイヤーAの期待勝率
 */
function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * 新しいレーティングを計算
 * @param currentRating 現在のレーティング
 * @param expectedScore 期待勝率
 * @param actualScore 実際の結果 (1: 勝ち, 0: 負け)
 * @returns 新しいレーティング
 */
function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number
): number {
  return Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
}

/**
 * 2つの写真の対戦結果から新しいレーティングを計算
 * @param winnerRating 勝者の現在のレーティング
 * @param loserRating 敗者の現在のレーティング
 * @returns 新しいレーティングのペア
 */
export function updateRatings(
  winnerRating: number,
  loserRating: number
): { newWinnerRating: number; newLoserRating: number } {
  const winnerExpected = getExpectedScore(winnerRating, loserRating);
  const loserExpected = getExpectedScore(loserRating, winnerRating);

  const newWinnerRating = calculateNewRating(winnerRating, winnerExpected, 1);
  const newLoserRating = calculateNewRating(loserRating, loserExpected, 0);

  return {
    newWinnerRating,
    newLoserRating,
  };
}

export { INITIAL_RATING };
