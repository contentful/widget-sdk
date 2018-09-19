/* global setImmediate */

export const document = (...content) => ({
  nodeClass: 'document',
  nodeType: 'document',
  content
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
  data: undefined
});

export const flushPromises = () =>
  new Promise(resolve => {
    setImmediate(() => {
      resolve();
    });
  });

export const setCaret = target => {
  const range = window.document.createRange();
  const sel = window.document.getSelection();
  const nodes = target.childNodes;

  const last = nodes[nodes.length - 1];

  range.setStart(last, 0);
  sel.removeAllRanges();
  sel.addRange(range);
};

export const getWithId = (wrapper, testId) => wrapper.find(`[data-test-id="${testId}"]`).first();
