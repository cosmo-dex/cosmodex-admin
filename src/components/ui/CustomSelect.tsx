'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  image?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  direction?: 'up' | 'down' | 'auto';
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  direction = 'auto',
  className = '',
  buttonClassName = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find((opt) => opt.value === value) || options[0];

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      if (direction === 'up') {
        setOpenUpwards(true);
      } else if (direction === 'down') {
        setOpenUpwards(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 240);
      }
      const activeIdx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, options, handleSelect]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full bg-[#160b2e]/90 hover:bg-[#1f103d] border rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99] ${
          isOpen
            ? 'border-[#E873C3] shadow-[0_0_15px_rgba(232,115,195,0.3)] ring-1 ring-[#E873C3]/50'
            : 'border-white/15 hover:border-white/30 focus:border-[#E873C3]'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOpt?.image && (
            <img
              src={selectedOpt.image}
              alt={selectedOpt.label}
              className="w-5 h-5 rounded-full border border-white/20 object-cover shrink-0"
            />
          )}
          {selectedOpt?.icon && <span className="shrink-0 text-[#E873C3]">{selectedOpt.icon}</span>}
          <span className="truncate font-semibold text-xs sm:text-sm tracking-wide">
            {selectedOpt?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform duration-200 shrink-0 ${
            isOpen ? (openUpwards ? 'rotate-0 text-[#E873C3]' : 'rotate-180 text-[#E873C3]') : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          data-lenis-prevent
          className={`absolute left-0 right-0 z-50 bg-[#12082b]/95 backdrop-blur-2xl border border-white/20 rounded-xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] p-1.5 max-h-56 overflow-y-auto space-y-1 scrollbar-thin animate-in fade-in zoom-in-95 duration-150 ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#E873C3]/25 to-[#8D37D6]/25 text-white border border-[#E873C3]/50 shadow-[0_0_12px_rgba(232,115,195,0.2)]'
                    : isFocused
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.image && (
                    <img
                      src={opt.image}
                      alt={opt.label}
                      className="w-6 h-6 rounded-full border border-white/20 object-cover shrink-0"
                    />
                  )}
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-[#E873C3] shrink-0 ml-2 animate-in zoom-in-75 duration-150" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
