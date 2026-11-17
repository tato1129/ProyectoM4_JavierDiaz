import type { Priority } from '../types';

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];
