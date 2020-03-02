import * as PublicContentType from 'widgets/PublicContentType';

/**
 * @typedef { import("contentful-ui-extensions-sdk").ContentType } ContentType
 */

/**
 * @param {{ $scope: Object }}
 * @return {ContentType}
 */
export function createContentTypeApi({ contentType }) {
  const publicContentType = PublicContentType.fromInternal(contentType);
  return publicContentType;
}
