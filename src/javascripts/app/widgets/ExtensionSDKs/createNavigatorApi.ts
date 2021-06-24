import { WidgetNamespace } from '@contentful/widget-renderer';
import { NavigatorAPI, NavigatorPageResponse } from '@contentful/app-sdk';
import { noop } from 'lodash';
import { onSlideLevelChanged } from 'navigation/SlideInNavigator/index';
import * as Navigator from 'states/Navigator';
import { router } from 'core/react-routing';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { find } from 'lodash';
import * as entityCreator from 'components/app_container/entityCreator';
import localeStore from 'services/localeStore';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import { NavigatorOpenResponse } from '@contentful/app-sdk';

function isAnotherBulkEditorOpen() {
  return !!find(SlideInNavigator.getSlideInEntities(), { type: 'BulkEditor' });
}

async function navigateToBulkEditor(options) {
  const { entryId, fieldId, locale, index } = options;

  if (isAnotherBulkEditorOpen()) {
    throw new Error(`Can't open bulk editor when there is another bulk editor open`);
  }

  const path = [entryId, fieldId, localeStore.toInternalCode(locale), index];

  const slide = SlideInNavigator.goToSlideInEntity({
    type: 'BulkEditor',
    path,
  });

  return { navigated: true, slide };
}

interface NavigatorProps {
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  isOnPageLocation?: boolean;
  isMaster: boolean;
  spaceId: string;
  environmentId: string;
  cma: any;
}

const SUPPORTED_WIDGET_NAMESPACE_ROUTES = [WidgetNamespace.EXTENSION, WidgetNamespace.APP];

const denyNavigate = () => {
  throw makeReadOnlyApiError(ReadOnlyApi.Navigate);
};

const makeNavigateToEntity = (cma: any) => {
  return async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }
    // open existing entity
    if (typeof options.id === 'string') {
      return openExistingEntity(options);
    }

    let entity;
    try {
      entity = await createEntity(options);
    } catch (e) {
      throw new Error('Failed to create an entity.');
    }

    return openExistingEntity({
      ...options,
      id: entity.sys.id,
    });
  };

  async function createEntity(options) {
    if (options.entityType === 'Entry' && typeof options.contentTypeId === 'string') {
      return await entityCreator.newEntry(options.contentTypeId);
    } else if (options.entityType === 'Asset') {
      return await entityCreator.newAsset();
    }

    throw new Error('Could not determine how to create the requested entity.');
  }

  function getEntity(options) {
    if (options.entityType === 'Asset') {
      return cma.getAsset(options.id);
    } else {
      return cma.getEntry(options.id);
    }
  }

  async function openExistingEntity({
    id,
    entityType,
    slideIn = false,
  }: {
    id: string;
    entityType: string;
    slideIn: boolean | { waitForClose: boolean };
  }) {
    const ret: NavigatorOpenResponse<any> = { navigated: true };
    const slideInfo = { id, type: entityType };

    try {
      if (slideIn) {
        if (typeof slideIn === 'object') {
          ret.slide = await SlideInNavigatorWithPromise.goToSlideInEntityWithPromise(slideInfo);
        } else {
          ret.slide = SlideInNavigator.goToSlideInEntity(slideInfo);
        }
      }

      ret.entity = await getEntity({ id, entityType });

      if (!slideIn) {
        await Navigator.go(Navigator.makeEntityRef(ret.entity));
      }
    } catch (err) {
      if (err.code !== 'NotFound') {
        throw new Error('Failed to navigate to the entity.');
      }
    }

    return ret;
  }
};

const makeNavigateToPage = (dependencies, isOnPageLocation = false) => {
  const { spaceId, environmentId, currentWidgetId, currentWidgetNamespace } = dependencies;

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

    if (!SUPPORTED_WIDGET_NAMESPACE_ROUTES.includes(type)) {
      throw new Error(`Unsupported type "${type}" was given!`);
    }

    if (isApp && currentWidgetId !== id) {
      throw new Error('The current ID does not match the ID of the app!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const isNavigatingToNewContext = currentWidgetId !== id;

    if (currentWidgetNamespace === WidgetNamespace.EXTENSION) {
      await router.navigate(
        {
          path: 'page-extension',
          spaceId,
          environmentId,
          extensionId: id,
          pathname: path || '',
        },
        {
          // If we are navigating to a new extension page OR we are not on the extension page,
          // we want to notify a state change of the URL. Otherwise, do NOT notify a state change
          // to ensure that the iframe on the page extension page doesn't reload.
          notify: isNavigatingToNewContext || !isOnPageLocation,
        }
      );

      return { navigated: true, path } as NavigatorPageResponse;
    }

    router.navigate(
      { path: 'apps.page', spaceId, environmentId, appId: id, pathname: path || '' },
      {
        // If we are navigating to a new extension page OR we are not on the extension page,
        // we want to notify a state change of the URL. Otherwise, do NOT notify a state change
        // to ensure that the iframe on the page extension page doesn't reload.
        notify: isNavigatingToNewContext || !isOnPageLocation,
      }
    );

    return { navigated: true, path } as NavigatorPageResponse;
  };
};

const makeNavigateToAppConfig =
  ({
    widgetNamespace,
    spaceId,
    environmentId,
    widgetId,
  }: {
    widgetNamespace: string;
    spaceId: string;
    environmentId: string;
    widgetId: string;
  }) =>
  () => {
    if (widgetNamespace === WidgetNamespace.APP) {
      return router.navigate(
        { path: 'apps.app-configuration', spaceId, environmentId, appId: widgetId },
        {
          notify: true,
        }
      );
    } else {
      throw new Error('Only apps can use the openAppConfig method');
    }
  };

const navigateToSpaceEnvRoute = async ({
  spaceId,
  environmentId,
  route,
}: {
  spaceId: string;
  environmentId: string;
  route: 'entries' | 'assets';
  isMaster: boolean;
}) => {
  if (route === 'entries') {
    router.navigate({ path: 'entries.list', spaceId, environmentId }, { notify: true });
  } else {
    router.navigate({ path: 'assets.list', spaceId, environmentId }, { notify: true });
  }
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
    openAppConfig: denyNavigate,
    openEntriesList: denyNavigate,
    openAssetsList: denyNavigate,
  };
}

export function createEntityNavigatorApi({ cma }: { cma: any }) {
  const navigateToContentEntity = makeNavigateToEntity(cma);
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
  };
}

export function createNavigatorApi({
  widgetNamespace,
  widgetId,
  isOnPageLocation = false,
  spaceId,
  environmentId,
  isMaster,
  cma,
}: NavigatorProps): NavigatorAPI {
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

  const openAppConfig = makeNavigateToAppConfig({
    widgetNamespace,
    spaceId,
    environmentId,
    widgetId,
  });

  return {
    ...createEntityNavigatorApi({ cma }),
    openPageExtension: (opts) => {
      return navigateToPage({ ...opts, type: WidgetNamespace.EXTENSION });
    },
    openCurrentAppPage: (opts) => {
      return navigateToPage({ ...opts, type: WidgetNamespace.APP });
    },
    openBulkEditor: (entryId, { fieldId, locale, index }) => {
      return navigateToBulkEditor({ entryId, fieldId, locale, index });
    },
    onSlideInNavigation: onSlideLevelChanged,
    openAppConfig,
    openEntriesList: () => {
      return navigateToSpaceEnvRoute({ spaceId, environmentId, isMaster, route: 'entries' });
    },
    openAssetsList: () => {
      return navigateToSpaceEnvRoute({ spaceId, environmentId, isMaster, route: 'assets' });
    },
  };
}
