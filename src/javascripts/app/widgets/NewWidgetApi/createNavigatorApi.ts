import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import makePageExtensionHandlers from 'widgets/bridges/makePageExtensionHandlers';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace, Widget } from 'features/widget-renderer';
import { SpaceContext } from '@contentful/worf';
import APIClient from 'data/APIClient';
import { NavigatorAPI } from 'contentful-ui-extensions-sdk';

interface NavigatorProps {
  widget: Widget;
  spaceContext: SpaceContext;
  cma: APIClient;
}

export function createNavigatorApi({ cma, spaceContext, widget }: NavigatorProps): NavigatorAPI {
  const navigateToContentEntity = makeExtensionNavigationHandlers({ cma });
  const navigateToBulkEditor = makeExtensionBulkNavigationHandlers();

  // TODO:
  //  Consider replacing spaceContext with the computed values (spaceId, environmentId, isMaster) if we don't need
  //  to compute this on the fly. In that case, we should also be replacing it in the create*ExtensionBridge files
  //  Also, if we eliminate the usage of makePageExtensionHandlers from everywhere else than here, we should
  //  consider merging this with it
  const navigateToPage = makePageExtensionHandlers({
    spaceContext,
    currentWidgetId: widget.id,
    currentWidgetNamespace: widget.namespace,
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
