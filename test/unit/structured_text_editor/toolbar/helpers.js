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

export const text = (value = '') => ({
  nodeClass: 'text',
  nodeType: 'text',
  value,
  marks: [],
  data: undefined
});

export const flushPromises = () =>
  new Promise(resolve => {
    setImmediate(() => {
      resolve();
    });
  });
