import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import makePageExtensionHandlers from 'widgets/bridges/makePageExtensionHandlers';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from 'features/widget-renderer';
import { NavigatorAPI } from 'contentful-ui-extensions-sdk';

interface NavigatorProps {
  spaceContext: any;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  readOnly?: boolean;
}

const denyNavigate = () => {
  throw new Error('Cannot navigate in Read Only mode');
};

const readOnlyNavigatorApi: NavigatorAPI = {
  onSlideInNavigation: denyNavigate,
  openAsset: denyNavigate,
  openBulkEditor: denyNavigate,
  openCurrentAppPage: denyNavigate,
  openEntry: denyNavigate,
  openNewAsset: denyNavigate,
  openNewEntry: denyNavigate,
  openPageExtension: denyNavigate,
};

export function createNavigatorApi({
  spaceContext,
  widgetNamespace,
  widgetId,
  readOnly = false,
}: NavigatorProps): NavigatorAPI {
  if (readOnly) {
    return readOnlyNavigatorApi;
  }

  const navigateToContentEntity = makeExtensionNavigationHandlers({ cma: spaceContext.cma });
  const navigateToBulkEditor = makeExtensionBulkNavigationHandlers();

  // TODO:
  //  Consider replacing spaceContext with the computed values (spaceId, environmentId, isMaster) if we don't need
  //  to compute this on the fly. In that case, we should also be replacing it in the create*ExtensionBridge files
  //  Also, if we eliminate the usage of makePageExtensionHandlers from everywhere else than here, we should
  //  consider merging this with it
  const navigateToPage = makePageExtensionHandlers({
    spaceContext,
    currentWidgetId: widgetId,
    currentWidgetNamespace: widgetNamespace,
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
