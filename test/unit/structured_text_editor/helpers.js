/* global setImmediate */
import { toKeyCode } from 'is-hotkey';

export const document = (...content) => ({
  nodeClass: 'document',
  nodeType: 'document',
  content,
  data: {}
});

export const block = (nodeType, data, ...content) => ({
  nodeClass: 'block',
  nodeType,
  content,
  data
});

export const inline = (nodeType, data, ...content) => ({
  nodeClass: 'inline',
  nodeType,
  content,
  data
});

export const text = (value = '', marks = []) => ({
  nodeClass: 'text',
  nodeType: 'text',
  value,
  marks,
  data: {}
});

export const flushPromises = () =>
  new Promise(resolve => {
    setImmediate(() => {
      resolve();
    });
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
