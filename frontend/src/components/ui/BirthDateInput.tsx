'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface BirthDateInputProps {
  value: string; // ISO yyyy-mm-dd or empty
  onChange: (isoDate: string) => void;
  error?: string;
  label?: string;
  className?: string;
  maxAge?: number; // minimum age (default 18)
  readOnly?: boolean;
}

function toDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return '';
}

function toISO(display: string): string {
  const digits = display.replace(/\D/g, '');
  if (digits.length === 8) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    return `${y}-${m}-${d}`;
  }
  return '';
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function BirthDateInput({
  value,
  onChange,
  error,
  label = 'Data de Nascimento',
  className,
  maxAge = 18,
  readOnly = false,
}: BirthDateInputProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - maxAge);
  const maxISO = maxDate.toISOString().split('T')[0];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const masked = applyMask(e.target.value);
    setDisplay(masked);
    const iso = toISO(masked);
    if (iso) onChange(iso);
    else if (masked === '') onChange('');
  };

  const handleDatePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    onChange(iso);
    setDisplay(toDisplay(iso));
  };

  const openPicker = () => {
    if (readOnly) return;
    try { dateRef.current?.showPicker(); } catch { dateRef.current?.click(); }
  };

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleTextChange}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          readOnly={readOnly}
          className={[
            'h-10 w-full rounded-md border bg-[#1a1a1a] pl-3 pr-10 text-base md:text-sm text-white placeholder-gray-600 focus:outline-none transition-colors',
            error ? 'border-red-500 focus:border-red-400' : 'border-[#3d3d3d] focus:border-[#C8A951]',
            readOnly ? 'cursor-not-allowed opacity-60 text-gray-500' : '',
          ].filter(Boolean).join(' ')}
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={readOnly}
          tabIndex={-1}
          aria-label="Abrir calendário"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C8A951] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Calendar size={16} />
        </button>
        {/* Hidden native date input — triggered only by calendar icon */}
        <input
          ref={dateRef}
          type="date"
          value={value || ''}
          onChange={handleDatePicker}
          max={maxISO}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute opacity-0 w-0 h-0 pointer-events-none top-0 left-0"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
