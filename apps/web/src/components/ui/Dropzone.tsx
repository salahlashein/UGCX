'use client';

import React, { useId, useState } from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { validateFile } from '../../utils/inputHelpers';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { Button } from './Button';
import { MiniBar } from './Meter';

export interface DropzoneProps {
  accept?: string[] | string;
  maxBytes?: number;
  maxSizeMB?: number;
  file?: File | null;
  onFile?: (file: File) => void;
  onFileSelect?: (file: File) => void;
  progress?: number | null;
  fileName?: string | null;
  onCancel?: () => void;
  error?: string | null;
  className?: string;
}

export function Dropzone({
  accept = ['video/mp4', 'video/quicktime', 'video/webm'],
  maxBytes,
  maxSizeMB,
  file,
  onFile,
  onFileSelect,
  progress,
  fileName,
  onCancel,
  error: propError,
  className = '',
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputId = useId();

  const error = propError ?? localError;
  const isUploading = typeof progress === 'number' && progress >= 0 && progress < 100;
  const isDone = typeof progress === 'number' && progress >= 100;

  const normalizedAccept = Array.isArray(accept)
    ? accept
    : accept
      ? accept.split(',').map((s) => s.trim())
      : ['video/mp4', 'video/quicktime', 'video/webm'];

  const effectiveMaxBytes = maxBytes ?? (maxSizeMB ? maxSizeMB * 1024 * 1024 : 250 * 1024 * 1024);

  // The hint names the file types this dropzone actually accepts, so an image
  // field never advertises video formats.
  const isImageOnly = normalizedAccept.every((t) => t.startsWith('image/'));
  const extensions = normalizedAccept
    .map((t) => t.split('/')[1] ?? t)
    .map((t) => (t === 'quicktime' ? 'mov' : t === 'jpeg' ? 'jpg' : t))
    .map((t) => t.toUpperCase());
  const uniqueExtensions = Array.from(new Set(extensions));
  const sizeLabel =
    effectiveMaxBytes >= 1024 * 1024
      ? `${Math.round(effectiveMaxBytes / (1024 * 1024))} MB`
      : `${Math.round(effectiveMaxBytes / 1024)} KB`;
  const hintText = `${uniqueExtensions.join(', ')} up to ${sizeLabel}`;
  const deliverFile = onFileSelect ?? onFile;
  // Extensions help iPhone Safari offer videos that report an unusual MIME type.
  const isVideo = normalizedAccept.some((t) => t.startsWith('video/'));
  const acceptAttribute = [
    ...normalizedAccept,
    ...(isVideo ? ['.mp4', '.mov', '.m4v', '.webm'] : []),
  ].join(',');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLocalError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
    // Clear the value so choosing the same video again still fires a change.
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const validation = validateFile(
      { size: file.size, type: file.type, name: file.name },
      { maxBytes: effectiveMaxBytes, accept: normalizedAccept },
    );

    if (!validation.valid) {
      setLocalError(validation.error ?? 'Invalid file');
      return;
    }

    setLocalError(null);
    deliverFile?.(file);
  };

  // A <label> opens the picker natively. iPhone Safari can ignore a script click
  // on a hidden input, so the input is visually hidden but not display:none.
  return (
    <label
      htmlFor={inputId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center p-6 text-center transition-all ${
        isUploading ? 'cursor-default' : 'cursor-pointer hover:bg-black/[0.01]'
      } ${className}`}
      style={{
        borderRadius: `${radius.card}px`,
        border: `2px dashed ${
          error ? colors.danger : isDragging ? colors.primary : colors.dashLine
        }`,
        backgroundColor: isDragging ? colors.accentSoft : colors.surface,
      }}
    >
      <input
        id={inputId}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileSelect}
        disabled={isUploading}
        className="sr-only"
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <Icon name="upload" size={28} color="primary" />
          <div className="flex flex-col items-center w-full">
            <AppText
              variant="body"
              color="ink"
              style={{ fontWeight: 500 }}
              className="truncate max-w-xs"
            >
              {fileName ?? 'Uploading file...'}
            </AppText>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: colors.primary,
                marginTop: 2,
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <MiniBar value={progress} max={100} height={6} />
          {onCancel ? (
            <Button title="Cancel" variant="ghost" size="sm" onClick={() => onCancel()} />
          ) : null}
        </div>
      ) : file && !isDone ? (
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: `${radius.full}px`,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Icon name="check" size={20} color="primary" />
          </div>
          <AppText
            variant="body"
            color="ink"
            style={{ fontWeight: 500 }}
            className="truncate max-w-xs"
          >
            {fileName ?? file.name}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatFileSize(file.size)} · Tap to choose a different file
          </AppText>
          {error ? (
            <span role="alert" style={{ fontSize: '12px', color: colors.danger }}>
              {error}
            </span>
          ) : null}
        </div>
      ) : isDone ? (
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: `${radius.full}px`,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Icon name="check" size={20} color="primary" />
          </div>
          <AppText variant="body" color="primary" style={{ fontWeight: 500 }}>
            {fileName ?? 'File uploaded successfully'}
          </AppText>
          <AppText variant="caption" color="muted">
            Tap or drag another file to replace it
          </AppText>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: `${radius.full}px`,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Icon name={isImageOnly ? 'file-text' : 'video'} size={22} color="muted" />
          </div>
          <div className="flex flex-col items-center">
            <AppText variant="body" color="ink" style={{ fontWeight: 500 }}>
              Choose a file or drag & drop here
            </AppText>
            <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
              {hintText}
            </AppText>
          </div>
          {error ? (
            <span
              role="alert"
              style={{
                fontSize: '12px',
                color: colors.danger,
                marginTop: 4,
              }}
            >
              {error}
            </span>
          ) : null}
        </div>
      )}
    </label>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
