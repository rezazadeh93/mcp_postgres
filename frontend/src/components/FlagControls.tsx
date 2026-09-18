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

interface FlagControlsProps {
  flags: Flag[];
  onChange: (flags: Flag[]) => void;
}

interface FlagGroupProps {
  title: string;
  labels: Record<Flag, string>;
  groupFlags: readonly Flag[];
  current: readonly Flag[];
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

export default function FlagControls({ flags, onChange }: FlagControlsProps) {
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
        <button type="button" className="btn-sm btn-secondary flag-reset" onClick={handleReset}>
          Reset flags
        </button>
      </div>
    </div>
  );
}
