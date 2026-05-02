import { useCallback } from 'react';
import { spawnConfetti } from '../utils/confetti';

export function useConfetti() {
  return useCallback(() => spawnConfetti(50), []);
}
