import * as PublicContentType from 'widgets/PublicContentType';

/**
 * @typedef { import("contentful-ui-extensions-sdk").ContentType } ContentType
 */

/**
 * @param {{ $scope: Object }}
 * @return {ContentType}
 */
export function createContentTypeApi({ $scope }) {
  const contentType = PublicContentType.fromInternal($scope.entityInfo.contentType);
  return contentType;
}
