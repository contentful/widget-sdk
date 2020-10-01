import { noop } from 'lodash';
import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { NavigatorAPI, NavigatorPageResponse } from 'contentful-ui-extensions-sdk';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import * as Navigator from 'states/Navigator';

interface NavigatorProps {
  spaceContext: any;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  isOnPageLocation?: boolean;
}

const SUPPORTED_WIDGET_NAMESPACE_ROUTES = {
  [WidgetNamespace.EXTENSION]: {
    path: ['pageExtensions'],
    paramId: 'extensionId',
  },
  [WidgetNamespace.APP]: {
    path: ['apps', 'page'],
    paramId: 'appId',
  },
};

const denyNavigate = () => {
  throw makeReadOnlyApiError(ReadOnlyApi.Navigate);
};

const makeNavigateToPage = (dependencies, isOnPageLocation = false) => {
  const {
    spaceId,
    environmentId,
    isMaster,
    currentWidgetId,
    currentWidgetNamespace,
  } = dependencies;

  return async (
    options: { id?: string; path?: string; type: WidgetNamespace } = {
      type: WidgetNamespace.EXTENSION,
    }
  ) => {
    const { id = currentWidgetId, path, type = WidgetNamespace.EXTENSION } = options;
    const isApp = type === WidgetNamespace.APP;

    if (!id) {
      throw new Error('The `id` option is required!');
    }

    if (currentWidgetNamespace !== type) {
      throw new Error('Cannot navigate between different widget types!');
    }

    if (!Object.keys(SUPPORTED_WIDGET_NAMESPACE_ROUTES).includes(type)) {
      throw new Error(`Unsupported type "${type}" was given!`);
    }

    if (isApp && currentWidgetId !== id) {
      throw new Error('The current ID does not match the ID of the app!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const isNavigatingToNewContext = currentWidgetId !== id;
    const widgetRouting = SUPPORTED_WIDGET_NAMESPACE_ROUTES[currentWidgetNamespace];

    await Navigator.go({
      path: ['spaces', 'detail'].concat(isMaster ? [] : ['environment']).concat(widgetRouting.path),
      params: {
        spaceId,
        environmentId,
        [widgetRouting.paramId]: id,
        path: path || '',
      },
      options: {
        // If we are navigating to a new extension page OR we are not on the extension page,
        // we want to notify a state change of the URL. Otherwise, do NOT notify a state change
        // to ensure that the iframe on the page extension page doesn't reload.
        notify: isNavigatingToNewContext || !isOnPageLocation,
      },
    });

    return { navigated: true, path } as NavigatorPageResponse;
  };
};

export function createReadOnlyNavigatorApi() {
  return {
    onSlideInNavigation: () => noop,
    openAsset: denyNavigate,
    openBulkEditor: denyNavigate,
    openCurrentAppPage: denyNavigate,
    openEntry: denyNavigate,
    openNewAsset: denyNavigate,
    openNewEntry: denyNavigate,
    openPageExtension: denyNavigate,
  };
}

export function createNavigatorApi({
  spaceContext,
  widgetNamespace,
  widgetId,
  isOnPageLocation = false,
}: NavigatorProps): NavigatorAPI {
  const navigateToContentEntity = makeExtensionNavigationHandlers({ cma: spaceContext.cma });
  const navigateToBulkEditor = makeExtensionBulkNavigationHandlers();
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();
  const isMaster = spaceContext.isMasterEnvironment();

  const navigateToPage = makeNavigateToPage(
    {
      spaceId,
      environmentId,
      isMaster,
      currentWidgetId: widgetId,
      currentWidgetNamespace: widgetNamespace,
    },
    isOnPageLocation
  );

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
