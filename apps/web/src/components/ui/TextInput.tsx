'use client';

import React, { useId } from 'react';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppText } from './AppText';

export interface TextInputProps {
  label?: string;
  value: string;
  onChangeText?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' | 'date';
  multiline?: boolean;
  rows?: number;
  numberOfLines?: number;
  mono?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
  style?: React.CSSProperties;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    value,
    onChangeText,
    onChange,
    placeholder,
    type = 'text',
    multiline = false,
    rows = 3,
    numberOfLines,
    mono = false,
    error,
    hint,
    disabled = false,
    required = false,
    dir,
    className = '',
    style,
  }: TextInputProps,
  ref,
) {
  const id = useId();
  const effectiveRows = numberOfLines ?? rows;
  const isMulti = multiline || Boolean(numberOfLines && numberOfLines > 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e);
    onChangeText?.(e.target.value);
  };

  const sharedStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.ink,
    borderRadius: `${radius.button}px`,
    border: `1.5px solid ${error ? colors.danger : colors.inputBorder}`,
    paddingInline: `${spacing.md}px`,
    paddingBlock: isMulti ? `${spacing.sm}px` : 0,
    minHeight: isMulti ? undefined : `${sizes.inputHeight}px`,
    fontSize: `${typography.body.fontSize}px`,
    lineHeight: `${typography.body.lineHeight}px`,
    fontFamily: mono ? 'var(--font-mono)' : undefined,
    outline: 'none',
    ...style,
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={id}>
          <AppText variant="label" color="ink">
            {label}
          </AppText>
        </label>
      ) : null}

      {isMulti ? (
        <textarea
          id={id}
          dir={dir}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={effectiveRows}
          disabled={disabled}
          required={required}
          style={sharedStyle}
        />
      ) : (
        <input
          ref={ref}
          id={id}
          dir={dir}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={sharedStyle}
        />
      )}

      {error ? (
        <p role="alert" className="m-0">
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        </p>
      ) : hint ? (
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      ) : null}
    </div>
  );
});
