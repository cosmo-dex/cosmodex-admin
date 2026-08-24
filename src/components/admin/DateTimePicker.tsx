'use client';

import React, { useRef } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  className = '',
}: DateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if ('showPicker' in el && typeof (el as HTMLInputElement & { showPicker: () => void }).showPicker === 'function') {
        (el as HTMLInputElement & { showPicker: () => void }).showPicker();
      } else {
        el.focus();
      }
    } catch {
      el.focus();
    }
  };

  const getFormattedDate = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formattedDisplay = getFormattedDate(value);

  const setRelativeTime = (hoursToAdd: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hoursToAdd);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={13} className="text-[#E873C3]" />
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw size={10} /> Clear
          </button>
        )}
      </div>

      {}
      <div
        onClick={handleOpenPicker}
        className="relative flex items-center bg-white/[0.04] border border-white/[0.08] hover:border-[#E873C3]/50 focus-within:border-[#E873C3]/80 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <Calendar size={16} className="text-[#E873C3] group-hover:scale-110 transition-transform" />
          <Clock size={15} className="text-purple-400 group-hover:scale-110 transition-transform" />
        </div>

        <input
          ref={inputRef}
          type="datetime-local"
          value={value ? value.slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
        />
      </div>

      {}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {formattedDisplay ? (
          <span className="text-[11px] font-semibold text-[#E873C3] bg-[#E873C3]/10 border border-[#E873C3]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span>📅 {formattedDisplay}</span>
          </span>
        ) : (
          <span className="text-[11px] text-white/30 italic">Click input to open calendar & clock</span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRelativeTime(0);
            }}
            className="text-[10px] font-semibold text-white/60 hover:text-white bg-white/[0.06] hover:bg-[#E873C3]/20 border border-white/[0.08] px-2 py-0.5 rounded transition-all cursor-pointer"
            title="Set to Current Time"
          >
            Now
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRelativeTime(24);
            }}
            className="text-[10px] font-semibold text-white/60 hover:text-white bg-white/[0.06] hover:bg-[#E873C3]/20 border border-white/[0.08] px-2 py-0.5 rounded transition-all cursor-pointer"
            title="Set to 1 Day from Now"
          >
            +1 Day
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRelativeTime(168);
            }}
            className="text-[10px] font-semibold text-white/60 hover:text-white bg-white/[0.06] hover:bg-[#E873C3]/20 border border-white/[0.08] px-2 py-0.5 rounded transition-all cursor-pointer"
            title="Set to 1 Week from Now"
          >
            +1 Wk
          </button>
        </div>
      </div>
    </div>
  );
}
