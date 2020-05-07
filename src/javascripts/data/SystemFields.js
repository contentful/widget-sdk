import { cloneDeep } from 'lodash';

const contentType = {
  id: 'contentType',
  name: 'Content Type',
  type: 'ContentType',
  canPersist: true,
};

const createdAt = {
  id: 'createdAt',
  name: 'Created',
  type: 'Date',
  canPersist: true,
};

const updatedAt = {
  id: 'updatedAt',
  name: 'Updated',
  type: 'Date',
  canPersist: true,
};

const publishedAt = {
  id: 'publishedAt',
  name: 'Published',
  type: 'Date',
  canPersist: true,
};

const author = {
  id: 'author',
  name: 'Author',
  type: 'Symbol',
};

const list = [contentType, createdAt, updatedAt, publishedAt, author];
const defaultFields = [contentType, updatedAt, author];
const fallbackFields = [contentType, publishedAt, createdAt, updatedAt];

const defaultOrder = {
  fieldId: updatedAt.id,
  direction: 'descending',
};

const returnCloneOf = (obj) => () => cloneDeep(obj);

export const getList = returnCloneOf(list);
export const getDefaultFieldIds = returnCloneOf(defaultFields.map((f) => f.id));
export const getDefaultOrder = returnCloneOf(defaultOrder);

export function getFallbackOrderField(availableFieldIds) {
  return fallbackFields.find((f) => (availableFieldIds || []).includes(f.id)) || { id: undefined };
}