import makeExtensionNavigationHandlers from 'widgets/bridges/makeExtensionNavigationHandlers';

/**
 * @typedef { import("contentful-ui-extensions-sdk").NavigatorAPI } NavigatorAPI
 */

/**
 * @param {{ spaceContext: Object }}
 * @return {NavigatorAPI}
 */
export function createNavigatorApi({ spaceContext }) {
  const navigateToContentEntity = makeExtensionNavigationHandlers({ spaceContext });

  return {
    openEntry: (id, opts) => {
      return navigateToContentEntity({ ...opts, entityType: 'Entry', id });
    },
    openNewEntry: (contentTypeId, opts) => {
      return navigateToContentEntity({
        ...opts,
        entityType: 'Entry',
        id: null,
        contentTypeId
      });
    },
    openAsset: (id, opts) => {
      return navigateToContentEntity({ ...opts, entityType: 'Asset', id });
    },
    openNewAsset: opts => {
      return navigateToContentEntity({ ...opts, entityType: 'Asset', id: null });
    },
    openPageExtension: () => {
      throw new Error('Not implemented yet');
    }
  };
}
