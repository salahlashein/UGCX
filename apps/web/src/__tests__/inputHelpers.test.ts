import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitPaste, clampRange, validateFile } from '../utils/inputHelpers';

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
