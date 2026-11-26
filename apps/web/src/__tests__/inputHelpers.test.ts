import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitPaste,
  clampRange,
  validateFile,
  resolveVideoContentType,
} from '../utils/inputHelpers';

describe('iPhone video files', () => {
  const videoOptions = {
    maxBytes: 500 * 1024 * 1024,
    accept: ['video/mp4', 'video/quicktime', 'video/webm'],
  };

  it('resolveVideoContentType keeps the three supported types', () => {
    assert.equal(resolveVideoContentType({ type: 'video/quicktime', name: 'IMG_0412.MOV' }), 'video/quicktime');
    assert.equal(resolveVideoContentType({ type: 'video/mp4', name: 'clip.mp4' }), 'video/mp4');
  });

  it('resolveVideoContentType uses the extension when Safari reports no type or x-m4v', () => {
    assert.equal(resolveVideoContentType({ type: '', name: 'IMG_0412.MOV' }), 'video/quicktime');
    assert.equal(resolveVideoContentType({ type: 'video/x-m4v', name: 'trim.m4v' }), 'video/mp4');
    assert.equal(resolveVideoContentType({ type: '', name: 'clip.webm' }), 'video/webm');
  });

  it('resolveVideoContentType rejects files the API cannot sign', () => {
    assert.equal(resolveVideoContentType({ type: 'image/heic', name: 'IMG_0001.HEIC' }), null);
    assert.equal(resolveVideoContentType({ type: '', name: 'notes' }), null);
  });

  it('validateFile accepts an iPhone .MOV that has an empty type', () => {
    const result = validateFile({ size: 80 * 1024 * 1024, type: '', name: 'IMG_0412.MOV' }, videoOptions);
    assert.equal(result.valid, true);
  });
});

describe('Input Helpers Suite', () => {
  it('splitPaste parses raw pasted strings into pure digits up to length', () => {
    assert.deepEqual(splitPaste('123456', 6), ['1', '2', '3', '4', '5', '6']);
    assert.deepEqual(splitPaste('12 34', 6), ['1', '2', '3', '4']);
    assert.deepEqual(splitPaste('abc9988xyz1122', 6), ['9', '9', '8', '8', '1', '1']);
  });

  it('clampRange enforces ordering and bounds', () => {
    assert.deepEqual(clampRange(50, 100, 0, 200), { low: 50, high: 100 });
    assert.deepEqual(clampRange(-20, 250, 0, 200), { low: 0, high: 200 });
    assert.deepEqual(clampRange(120, 80, 0, 200), { low: 80, high: 80 });
  });

  it('validateFile rejects oversized or unsupported files with canonical messages', () => {
    const options = {
      maxBytes: 250 * 1024 * 1024,
      accept: ['video/mp4', 'video/quicktime', 'video/webm'],
    };

    const oversized = { size: 251 * 1024 * 1024, type: 'video/mp4' };
    const invalidType = { size: 10 * 1024 * 1024, type: 'image/png' };
    const valid = { size: 50 * 1024 * 1024, type: 'video/mp4' };

    const resOversized = validateFile(oversized, options);
    assert.equal(resOversized.valid, false);
    assert.equal(resOversized.error, 'This file is larger than 250 MB');

    const resType = validateFile(invalidType, options);
    assert.equal(resType.valid, false);
    assert.equal(resType.error, 'This file type is not supported');

    const resValid = validateFile(valid, options);
    assert.equal(resValid.valid, true);
    assert.equal(resValid.error, undefined);
  });
});
