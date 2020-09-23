export const linkedTags = [
  { sys: { id: 'tagId1', type: 'Link', linkType: 'Tag' } },
  { sys: { id: 'tagId2', type: 'Link', linkType: 'Tag' } },
];

export const initiallyLinkedTags = [{ sys: { id: 'tagId', type: 'Link', linkType: 'Tag' } }];

export const newEntry = (fields, metadata) => ({
  sys: {
    type: 'Entry',
    version: 1,
    contentType: {
      sys: { id: 'ctId' },
    },
    updatedAt: '2020-06-06T12:58:25.641Z',
    updatedBy: {
      sys: { id: 'userId' },
    },
  },
  fields: fields || {
    fieldA: { 'en-US': 'en' },
    fieldB: { 'en-US': 'val-EN', de: 'val-DE' },
    listField: { 'en-US': ['one'] },
    symbolField: { 'en-US': 'symbol value' },
    textField: { 'en-US': 'text value' },
  },
  ...metadata,
});

export const newAsset = (fields) => ({
  sys: {
    type: 'Asset',
    version: 1,
    updatedBy: {
      sys: { id: 'userId' },
    },
  },
  fields: fields || {
    title: { 'en-US': 'foo' },
    file: { 'en-US': { url: 'https://example.com/foo.jpg' } },
  },
});

export const newContentType = (sys, fields) => ({
  sys,
  fields: fields || [
    { id: 'fieldA' },
    { id: 'fieldB' },
    { id: 'unsetField' },
    { id: 'listField', type: 'Array', items: { type: 'Symbol' } },
    { id: 'symbolField', type: 'Symbol' },
    { id: 'textField', type: 'Text' },
  ],
});
