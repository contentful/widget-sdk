import { isString, find, filter } from 'lodash';

export const TYPES = {
  ENTRY: 'Entry',
  ASSET: 'Asset',
};

export function entityToLink(entity) {
  return { sys: { type: 'Link', id: entity.sys.id, linkType: entity.sys.type } };
}

export function getAvailableContentTypes(space, field) {
  return space
    .getContentTypes({ order: 'name', limit: 1000 })
    .then((res) => filter(res.items, canCreate(field)));
}

export function canLinkToContentType(field, ct) {
  const contentTypes = getValidContentTypesForField(field);
  return !contentTypes || contentTypes.indexOf(ct.sys.id) > -1;
}

function canCreate(field) {
  return (ct) => !!ct.sys.publishedVersion && canLinkToContentType(field, ct);
}

function getValidContentTypesForField(field) {
  const validations = [].concat(field.validations || [], field.itemValidations || []);
  const found = find(
    validations,
    (v) => Array.isArray(v.linkContentType) || isString(v.linkContentType)
  );
  const contentTypes = found && found.linkContentType;
  return isString(contentTypes) ? [contentTypes] : contentTypes;
}
