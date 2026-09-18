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

function normalizeFlags(flags: readonly Flag[] | null | undefined): Flag[] {
  return Array.isArray(flags) ? (flags as Flag[]) : [];
}

export function hasFlag(
  flags: readonly Flag[] | null | undefined,
  flag: Flag
): boolean {
  return normalizeFlags(flags).includes(flag);
}

export function possibilityFlag(
  flags: readonly Flag[] | null | undefined
): Flag | undefined {
  return POSSIBILITY_FLAGS.find((f) => hasFlag(flags, f));
}

export function exclusionFlag(
  flags: readonly Flag[] | null | undefined
): Flag | undefined {
  return EXCLUSION_FLAGS.find((f) => hasFlag(flags, f));
}

export function canToggleForApplying(
  flags: readonly Flag[] | null | undefined
): boolean {
  return possibilityFlag(flags) !== undefined && exclusionFlag(flags) === undefined;
}

export function isFlagDisabled(
  flags: readonly Flag[] | null | undefined,
  flag: Flag
): boolean {
  if (POSSIBILITY_FLAGS.includes(flag)) {
    return exclusionFlag(flags) !== undefined;
  }
  if (flag === 'for_applying') {
    return !canToggleForApplying(flags);
  }
  return false;
}

export function toggleFlag(
  current: readonly Flag[] | null | undefined,
  flag: Flag
): Flag[] {
  const flags = normalizeFlags(current);

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

export function rowHighlightClass(
  flags: readonly Flag[] | null | undefined
): string {
  const list = normalizeFlags(flags);
  if (list.includes('important')) return 'important';
  if (list.includes('snooze')) return 'snooze';
  if (list.includes('no_fit') || list.includes('NOT_RELEVANT')) return 'excluded';
  if (list.includes('for_applying')) return 'for_applying';
  if (list.includes('high_possibility')) return 'high_possibility';
  if (list.includes('medium_possibility')) return 'medium_possibility';
  if (list.includes('low_possibility')) return 'low_possibility';
  return '';
}
