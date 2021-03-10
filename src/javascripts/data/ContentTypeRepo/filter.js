import { Action } from 'access_control/AccessChecker';
import { probableContentTypeAccess } from 'access_control/AccessChecker/PolicyChecker';

export function getReadableContentTypes(contentTypes, selectedCtId) {
  const readAbleContentTypes = probableContentTypeAccess(Action.READ, contentTypes);
  const selectedContentType = contentTypes.find((ct) => selectedCtId === ct.sys.id);
  if (selectedContentType) {
    // to prevent duplication remove selectedContentType if it is in the list, and then add it
    return readAbleContentTypes
      .filter((ct) => selectedCtId !== ct.sys.id)
      .concat(selectedContentType)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return readAbleContentTypes.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCreatableContentTypes(publishedContentTypes) {
  return probableContentTypeAccess(Action.CREATE, publishedContentTypes).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
