import { WidgetNamespace } from '@contentful/widget-renderer';
import { NavigatorAPI, NavigatorPageResponse } from 'contentful-ui-extensions-sdk';
import { noop } from 'lodash';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import * as Navigator from 'states/Navigator';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { find } from 'lodash';
import * as entityCreator from 'components/app_container/entityCreator';
import get from 'lodash/get';
import localeStore from 'services/localeStore';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import { NavigatorOpenResponse } from 'contentful-ui-extensions-sdk';

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
    // Important note:
    // `entityCreator` returns legacy client entities, we need to extract `entity.data`.

    if (options.entityType === 'Entry' && typeof options.contentTypeId === 'string') {
      const created = await entityCreator.newEntry(options.contentTypeId);
      return created.data;
    } else if (options.entityType === 'Asset') {
      const created = await entityCreator.newAsset();
      return created.data;
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
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();
  const isMaster = spaceContext.isMasterEnvironment();

  const navigateToContentEntity = makeNavigateToEntity(spaceContext.cma);
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
