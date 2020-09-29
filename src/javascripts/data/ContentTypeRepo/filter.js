import { canPerformActionOnEntryOfType, Action } from 'access_control/AccessChecker';

export function getReadableContentTypes(contentTypes, selectedCtId) {
  return contentTypes.filter((ct) => isReadableOrSelected(selectedCtId, ct));
}

export function getCreatableContentTypes(publishedContentTypes) {
  return publishedContentTypes.filter(isCreatable);
}

function isReadableOrSelected(selectedCtId, ct) {
  // Get only accessible content types or one
  // in the query parameter. (e.g from saved search views)
  return isReadable(ct) || isSelected(selectedCtId, ct);
}

function isReadable(ct) {
  return canPerformActionOnEntryOfType(Action.READ, ct.sys.id);
}

function isCreatable(ct) {
  return canPerformActionOnEntryOfType(Action.CREATE, ct.sys.id);
}

function isSelected(selectedCtId, ct) {
  return selectedCtId === ct.sys.id;
}
