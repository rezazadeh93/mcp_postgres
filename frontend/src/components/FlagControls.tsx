import { useEffect, useRef, useState } from 'react';
import type { Flag } from '../types';
import {
  FLAG_LABELS,
  OUTCOME_FLAGS,
  POSSIBILITY_FLAGS,
  STATUS_FLAGS,
  hasFlag,
  isFlagDisabled,
  resetFlags,
  toggleFlag,
} from '../flags';

const NOTE_MAX_LEN = 4000;

interface FlagControlsProps {
  flags: Flag[] | null;
  note: string | null;
  onChange: (flags: Flag[]) => void;
  onNoteChange: (note: string) => void;
}

interface FlagGroupProps {
  title: string;
  labels: Record<Flag, string>;
  groupFlags: readonly Flag[];
  current: readonly Flag[] | null;
  onToggle: (flag: Flag) => void;
}

function FlagGroup({ title, labels, groupFlags, current, onToggle }: FlagGroupProps) {
  return (
    <div className="flag-group">
      <div className="flag-group-title">{title}</div>
      <div className="flag-group-actions">
        {groupFlags.map((flag) => {
          const active = hasFlag(current, flag);
          const disabled = isFlagDisabled(current, flag);
          return (
            <button
              key={flag}
              type="button"
              className={`btn-sm ${active ? `active active-${flag}` : 'btn-secondary'} ${disabled ? 'disabled' : ''}`}
              disabled={disabled}
              onClick={() => onToggle(flag)}
            >
              {labels[flag]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FlagControls({ flags, note, onChange, onNoteChange }: FlagControlsProps) {
  const [draft, setDraft] = useState(note ?? '');
  const draftRef = useRef(draft);
  const savedNoteRef = useRef(note ?? '');
  const onNoteChangeRef = useRef(onNoteChange);
  const timerRef = useRef<number | null>(null);

  draftRef.current = draft;
  savedNoteRef.current = note ?? '';
  onNoteChangeRef.current = onNoteChange;

  useEffect(() => {
    setDraft(note ?? '');
  }, [note]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      const latest = draftRef.current;
      if (latest !== savedNoteRef.current) {
        onNoteChangeRef.current(latest);
      }
    };
  }, []);

  const flush = (value: string) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (value !== savedNoteRef.current) {
      onNoteChange(value);
    }
  };

  const handleNoteInput = (value: string) => {
    const next = value.slice(0, NOTE_MAX_LEN);
    setDraft(next);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      onNoteChange(next);
    }, 400);
  };

  const handleToggle = (flag: Flag) => {
    onChange(toggleFlag(flags, flag));
  };

  const handleReset = () => {
    onChange(resetFlags());
  };

  return (
    <div>
      <FlagGroup
        title="Status"
        labels={FLAG_LABELS}
        groupFlags={STATUS_FLAGS}
        current={flags}
        onToggle={handleToggle}
      />
      <FlagGroup
        title="Possibility"
        labels={FLAG_LABELS}
        groupFlags={POSSIBILITY_FLAGS}
        current={flags}
        onToggle={handleToggle}
      />
      <FlagGroup
        title="Outcome"
        labels={FLAG_LABELS}
        groupFlags={OUTCOME_FLAGS}
        current={flags}
        onToggle={handleToggle}
      />
      <div className="flag-group">
        <div className="flag-group-title">Note</div>
        <textarea
          className="flag-note"
          value={draft}
          rows={3}
          maxLength={NOTE_MAX_LEN}
          placeholder="Optional note"
          onChange={(e) => handleNoteInput(e.target.value)}
          onBlur={() => flush(draft)}
        />
      </div>
      <div className="flag-group">
        <button type="button" className="btn-sm btn-secondary flag-reset" onClick={handleReset}>
          Reset flags
        </button>
      </div>
    </div>
  );
}
