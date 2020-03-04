import makeExtensionNavigationHandlers from 'widgets/bridges/makeExtensionNavigationHandlers';
import { slideInStackEmitter } from 'navigation/SlideInNavigator/index';

/**
 * @typedef { import("contentful-ui-extensions-sdk").NavigatorAPI } NavigatorAPI
 */

/**
 * @param {APIClient} cma
 * @return {NavigatorAPI}
 */
export function createNavigatorApi({ cma }) {
  const navigateToContentEntity = makeExtensionNavigationHandlers({ cma });

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
    },
    /**
     * @alpha
     * not available in a real sdk yet
     */
    onSlideInNavigation: fn => {
      const funcWrapper = ({ currentSlideLevel, targetSlideLevel }) => {
        fn({ newSlideLevel: targetSlideLevel, oldSlideLevel: currentSlideLevel });
      };
      slideInStackEmitter.on('changed', funcWrapper);
      return () => {
        slideInStackEmitter.off('changed', funcWrapper);
      };
    }
  };
}
