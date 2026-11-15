'use client';

import React, { useRef, useEffect } from 'react';
import { OTP_CODE_LENGTH } from '@ugcx/shared-types';
import { colors, radius } from '../../theme/tokens';
import { splitPaste } from '../../utils/inputHelpers';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function OtpInput({
  length = OTP_CODE_LENGTH,
  value,
  onChange,
  onComplete,
  autoFocus = false,
  disabled = false,
  error = false,
  className = '',
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const chars = value.split('').slice(0, length);
  while (chars.length < length) {
    chars.push('');
  }

  const handleInputChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newChars = [...chars];
    newChars[idx] = char;
    const newVal = newChars.join('').trimEnd();
    onChange(newVal);

    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (newVal.length === length) {
      onComplete?.(newVal);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!chars[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = splitPaste(pasted, length);
    if (digits.length > 0) {
      const newVal = digits.join('');
      onChange(newVal);
      const nextIdx = Math.min(digits.length, length - 1);
      inputsRef.current[nextIdx]?.focus();

      if (newVal.length === length) {
        onComplete?.(newVal);
      }
    }
  };

  return (
    <div dir="ltr" className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={chars[idx] ?? ''}
          onChange={(e) => handleInputChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          className="text-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2f5d46]/30"
          style={{
            width: 48,
            height: 52,
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 500,
            borderRadius: `${radius.button}px`,
            backgroundColor: colors.surface,
            border: `1.5px solid ${error ? colors.danger : chars[idx] ? colors.primary : colors.inputBorder}`,
            color: colors.ink,
          }}
        />
      ))}
    </div>
  );
}
