import { useEffect, useRef, useState } from 'react';
import type { Flag } from '../types';
import FlagControls from './FlagControls';

interface FlagDropdownProps {
  flags: Flag[] | null;
  note: string | null;
  onChange: (flags: Flag[]) => void;
  onNoteChange: (note: string) => void;
}

export default function FlagDropdown({ flags, note, onChange, onNoteChange }: FlagDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const activeCount = flags?.length ?? 0;
  const hasNote = Boolean(note?.trim());
  let label = 'Flags';
  if (activeCount > 0) label = `Flags (${activeCount})`;
  if (hasNote) label += ' · note';

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flag-dropdown" ref={ref} onClick={stopPropagation}>
      <button
        type="button"
        className={`btn-sm ${activeCount > 0 || hasNote ? 'active' : 'btn-secondary'}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label} ▾
      </button>
      {open && (
        <div className="flag-dropdown-menu" onClick={stopPropagation}>
          <FlagControls flags={flags} note={note} onChange={onChange} onNoteChange={onNoteChange} />
        </div>
      )}
    </div>
  );
}
