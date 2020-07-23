import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import makePageExtensionHandlers from 'widgets/bridges/makePageExtensionHandlers';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from 'features/widget-renderer';

/**
 * @typedef { import("contentful-ui-extensions-sdk").NavigatorAPI } NavigatorAPI
 */

/**
 * @param {APIClient} cma
 * @param {SpaceContext} spaceContext
 * @param {Widget} widget
 * @return {NavigatorAPI}
 */
export function createNavigatorApi({ cma, spaceContext, widget }) {
  const navigateToContentEntity = makeExtensionNavigationHandlers({ cma });
  const navigateToBulkEditor = makeExtensionBulkNavigationHandlers();

  // TODO:
  //  Consider replacing spaceContext with the computed values (spaceId, environmentId, isMaster) if we don't need
  //  to compute this on the fly. In that case, we should also be replacing it in the create*ExtensionBridge files
  const navigateToPage = makePageExtensionHandlers({
    spaceContext,
    currentWidgetId: widget.widgetId,
    currentWidgetNamespace: widget.widgetNamespace,
  });

  return {
    openEntry: (id, opts) => {
      return navigateToContentEntity({ ...opts, entityType: 'Entry', id });
    },
    openNewEntry: (contentTypeId, opts) => {
      return navigateToContentEntity({
        ...opts,
        entityType: 'Entry',
        id: null,
        contentTypeId,
      });
    },
    openAsset: (id, opts) => {
      return navigateToContentEntity({ ...opts, entityType: 'Asset', id });
    },
    openNewAsset: (opts) => {
      return navigateToContentEntity({ ...opts, entityType: 'Asset', id: null });
    },
    openPageExtension: (opts) => {
      return navigateToPage({ ...opts, type: WidgetNamespace.EXTENSION });
    },
    openCurrentAppPage: (opts) => {
      return navigateToPage({ ...opts, type: WidgetNamespace.APP });
    },
    openBulkEditor: (entryId, { fieldId, locale, index }) => {
      return navigateToBulkEditor({ entryId, fieldId, locale, index });
    },
    onSlideInNavigation,
  };
}
