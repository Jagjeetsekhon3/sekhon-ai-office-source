// Neutral Sekhon office dialogue. Legacy avatar keys remain compatible.
import type { OfficeCharacterName } from './cast';
export type BreakSpot = 'coffee' | 'vending' | 'snack' | 'table';
const pick = <T,>(arr: readonly T[], seed: number): T => arr[((seed % arr.length) + arr.length) % arr.length];
const SPOT_POOL: Record<BreakSpot, readonly string[]> = {
  coffee: ['Coffee, then a fresh look.', 'Taking a quick coffee break.', 'Ready for the next task.'],
  vending: ['Time for a small snack.', 'A short break helps me focus.'],
  snack: ['Refuelling for the next task.', 'Back to the project shortly.'],
  table: ['Reviewing the next milestone.', 'Good progress at Sekhon today.', 'Taking a moment to recharge.'],
};
export function pickSoloLine(_character: OfficeCharacterName, spot: BreakSpot, seed: number): string {
  return pick(SPOT_POOL[spot], seed);
}
type Exchange = readonly string[];
const EXCHANGES: readonly Exchange[] = [
  ['How is the project going?', 'The next milestone is clear.'],
  ['Ready for the review?', 'The notes are on the task board.'],
  ['Coffee break?', 'Then back to the next task.'],
  ['What should we check next?', 'Quality, scope and delivery.'],
];
export function pickExchange(_speaker: OfficeCharacterName, seed: number): Exchange {
  return pick(EXCHANGES, seed);
}
