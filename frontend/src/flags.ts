import type { Flag } from './types';

export const FLAG_LABELS: Record<Flag, string> = {
  snooze: 'Snooze',
  important: 'Important',
  low_possibility: 'Low',
  medium_possibility: 'Medium',
  high_possibility: 'High',
  for_applying: 'For applying',
  no_fit: 'No fit',
  NOT_RELEVANT: 'NOT RELEVANT',
};

export const POSSIBILITY_FLAGS: readonly Flag[] = [
  'low_possibility',
  'medium_possibility',
  'high_possibility',
];

export const EXCLUSION_FLAGS: readonly Flag[] = ['no_fit', 'NOT_RELEVANT'];

export const STATUS_FLAGS: readonly Flag[] = ['snooze', 'important'];

export const OUTCOME_FLAGS: readonly Flag[] = ['for_applying', ...EXCLUSION_FLAGS];

export function hasFlag(flags: readonly Flag[], flag: Flag): boolean {
  return flags.includes(flag);
}

export function possibilityFlag(flags: readonly Flag[]): Flag | undefined {
  return POSSIBILITY_FLAGS.find((f) => flags.includes(f));
}

export function exclusionFlag(flags: readonly Flag[]): Flag | undefined {
  return EXCLUSION_FLAGS.find((f) => flags.includes(f));
}

export function canToggleForApplying(flags: readonly Flag[]): boolean {
  return possibilityFlag(flags) !== undefined && exclusionFlag(flags) === undefined;
}

export function isFlagDisabled(flags: readonly Flag[], flag: Flag): boolean {
  if (POSSIBILITY_FLAGS.includes(flag)) {
    return exclusionFlag(flags) !== undefined;
  }
  if (flag === 'for_applying') {
    return !canToggleForApplying(flags);
  }
  return false;
}

export function toggleFlag(current: readonly Flag[], flag: Flag): Flag[] {
  const flags = [...current];

  if (STATUS_FLAGS.includes(flag)) {
    return flags.includes(flag)
      ? flags.filter((f) => f !== flag)
      : [...flags, flag];
  }

  if (POSSIBILITY_FLAGS.includes(flag)) {
    if (exclusionFlag(flags)) {
      return flags;
    }
    const has = flags.includes(flag);
    const without = flags.filter(
      (f) => !POSSIBILITY_FLAGS.includes(f) && f !== 'for_applying'
    );
    return has ? without : [...without, flag];
  }

  if (flag === 'for_applying') {
    if (!canToggleForApplying(flags)) {
      return flags;
    }
    return flags.includes(flag)
      ? flags.filter((f) => f !== flag)
      : [...flags, flag];
  }

  if (EXCLUSION_FLAGS.includes(flag)) {
    const has = flags.includes(flag);
    const base = flags.filter(
      (f) =>
        !POSSIBILITY_FLAGS.includes(f) &&
        f !== 'for_applying' &&
        !EXCLUSION_FLAGS.includes(f)
    );
    return has ? base : [...base, flag];
  }

  return flags;
}

export function resetFlags(): Flag[] {
  return [];
}

export function rowHighlightClass(flags: readonly Flag[]): string {
  if (flags.includes('important')) return 'important';
  if (flags.includes('snooze')) return 'snooze';
  if (flags.includes('no_fit') || flags.includes('NOT_RELEVANT')) return 'excluded';
  if (flags.includes('for_applying')) return 'for_applying';
  if (flags.includes('high_possibility')) return 'high_possibility';
  if (flags.includes('medium_possibility')) return 'medium_possibility';
  if (flags.includes('low_possibility')) return 'low_possibility';
  return '';
}
