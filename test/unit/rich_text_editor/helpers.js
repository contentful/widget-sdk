/* global setImmediate */
import { toKeyCode } from 'is-hotkey';

export const document = (...content) => ({
  nodeType: 'document',
  content,
  data: {}
});

export const block = (nodeType, data, ...content) => ({
  nodeType,
  content,
  data
});

export const inline = (nodeType, data, ...content) => ({
  nodeType,
  content,
  data
});

export const text = (value = '', marks = []) => ({
  nodeType: 'text',
  value,
  marks,
  data: {}
});

export const keyChord = (key, opts) => ({
  key,
  keyCode: toKeyCode(key),
  which: toKeyCode(key),
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ctrlKey: false,
  ...opts
});

export const getWithId = (wrapper, testId) => wrapper.find(`[data-test-id="${testId}"]`).first();
