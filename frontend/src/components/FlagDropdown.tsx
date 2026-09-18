import { useEffect, useRef, useState } from 'react';
import type { Flag } from '../types';
import FlagControls from './FlagControls';

interface FlagDropdownProps {
  flags: Flag[];
  onChange: (flags: Flag[]) => void;
}

export default function FlagDropdown({ flags, onChange }: FlagDropdownProps) {
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

  const activeCount = flags.length;
  const label = activeCount > 0 ? `Flags (${activeCount})` : 'Flags';

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flag-dropdown" ref={ref} onClick={stopPropagation}>
      <button
        type="button"
        className={`btn-sm ${activeCount > 0 ? 'active' : 'btn-secondary'}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label} ▾
      </button>
      {open && (
        <div className="flag-dropdown-menu" onClick={stopPropagation}>
          <FlagControls flags={flags} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
