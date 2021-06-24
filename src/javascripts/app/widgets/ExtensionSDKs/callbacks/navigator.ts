import { NavigatorCallbacks } from '@contentful/experience-sdk';
import {
  AppPageLocationOptions,
  NavigatorAPIOptions,
  NavigatorOpenResponse,
  NavigatorPageResponse,
  PageExtensionOptions,
} from '@contentful/app-sdk';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as Navigator from 'states/Navigator';
import { AssetProps, EntryProps } from 'contentful-management/types';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { router } from 'core/react-routing';
import localeStore from 'services/localeStore';

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

interface NavigateToPageOptions {
  id?: string;
  path?: string;
  type: WidgetNamespace;
}

interface MakeNavigateToPageProps {
  spaceContext: {
    spaceId: string;
    environmentId: string;
    isMaster: boolean;
  };
  widgetRef: {
    widgetId: string;
    widgetNamespace: WidgetNamespace;
  };
  isOnPageLocation?: boolean;
}

async function navigateToAppConfig({ widgetRef, spaceContext }: MakeNavigateToPageProps) {
  if (widgetRef.widgetNamespace === WidgetNamespace.APP) {
    return router.navigate(
      {
        path: 'apps.app-configuration',
        spaceId: spaceContext.spaceId,
        environmentId: spaceContext.environmentId,
        appId: widgetRef.widgetId,
      },
      {
        notify: true,
      }
    );
  } else {
    throw new Error('Only apps can use the openAppConfig method');
  }
}

async function navigateToSpaceEnvRoute(
  route: 'entries' | 'assets',
  { spaceContext }: MakeNavigateToPageProps
) {
  if (route === 'assets') {
    await router.navigate(
      {
        path: 'assets.list',
        spaceId: spaceContext.spaceId,
        environmentId: spaceContext.environmentId,
      },
      { notify: true }
    );
  } else if (route === 'entries') {
    await router.navigate(
      {
        path: 'entries.list',
        spaceId: spaceContext.spaceId,
        environmentId: spaceContext.environmentId,
      },
      { notify: true }
    );
  }
}

function onSlideInNavigation(fn) {
  const funcWrapper = ({ newSlideLevel, oldSlideLevel }) => {
    fn({ newSlideLevel, oldSlideLevel });
  };
  SlideInNavigator.slideInStackEmitter.on(
    SlideInNavigator.SlideEventTypes.SLIDE_LEVEL_CHANGED,
    funcWrapper
  );
  return () => {
    SlideInNavigator.slideInStackEmitter.off(
      SlideInNavigator.SlideEventTypes.SLIDE_LEVEL_CHANGED,
      funcWrapper
    );
  };
}

async function openBulkEditor(
  entryId: string,
  options: {
    fieldId: string;
    locale: string;
    index: number;
  }
) {
  const { fieldId, locale, index } = options;
  const isAnotherBulkEditorOpen = SlideInNavigator.getSlideInEntities().find(
    (i) => i.type === 'BulkEditor'
  );

  if (isAnotherBulkEditorOpen) {
    throw new Error(`Can't open bulk editor when there is another bulk editor open`);
  }

  const path = [entryId, fieldId, localeStore.toInternalCode(locale), index];

  const slide = SlideInNavigator.goToSlideInEntity({
    type: 'BulkEditor',
    path,
  });

  return { navigated: true, slide };
}

function makeNavigateToPage(props: MakeNavigateToPageProps) {
  const { spaceContext, isOnPageLocation = false, widgetRef } = props;

  return async (
    options: NavigateToPageOptions = {
      type: WidgetNamespace.EXTENSION,
    }
  ) => {
    const { id = widgetRef.widgetId, path, type = WidgetNamespace.EXTENSION } = options;
    const isApp = type === WidgetNamespace.APP;

    if (!id) {
      throw new Error('The `id` option is required!');
    }

    if (widgetRef.widgetNamespace !== type) {
      throw new Error('Cannot navigate between different widget types!');
    }

    if (!Object.keys(SUPPORTED_WIDGET_NAMESPACE_ROUTES).includes(type)) {
      throw new Error(`Unsupported type "${type}" was given!`);
    }

    if (isApp && widgetRef.widgetId !== id) {
      throw new Error('The current ID does not match the ID of the app!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const isNavigatingToNewContext = widgetRef.widgetId !== id;

    if (widgetRef.widgetNamespace === WidgetNamespace.EXTENSION) {
      await router.navigate(
        {
          path: 'page-extension',
          spaceId: spaceContext.spaceId,
          environmentId: spaceContext.environmentId,
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

    await router.navigate(
      {
        path: 'apps.page',
        spaceId: spaceContext.spaceId,
        environmentId: spaceContext.environmentId,
        appId: id,
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
  };
}

async function openEntity<T extends AssetProps | EntryProps>({
  entity,
  options = {},
}: {
  entity: T;
  options?: NavigatorAPIOptions;
}): Promise<NavigatorOpenResponse<T>> {
  const { slideIn } = options;
  const ret: NavigatorOpenResponse<T> = { navigated: true };
  const slideInfo = { id: entity.sys.id, type: entity.sys.type };

  try {
    if (slideIn) {
      if (typeof slideIn === 'object') {
        ret.slide = await SlideInNavigatorWithPromise.goToSlideInEntityWithPromise(slideInfo);
      } else {
        ret.slide = SlideInNavigator.goToSlideInEntity(slideInfo);
      }
    }

    ret.entity = entity;

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

type CreateNavigatorCallbacksOptions = MakeNavigateToPageProps;

export function createNavigatorCallbacks(
  options: CreateNavigatorCallbacksOptions
): NavigatorCallbacks {
  const navigateTo = makeNavigateToPage(options);

  return {
    openAssetsList: () => navigateToSpaceEnvRoute('assets', options),
    openEntriesList: () => navigateToSpaceEnvRoute('entries', options),
    handleNewAsset(asset: AssetProps, options?: NavigatorAPIOptions) {
      return openEntity({ entity: asset, options });
    },
    handleNewEntry<Field>(entry: EntryProps<Field>, options?: NavigatorAPIOptions) {
      return openEntity({ entity: entry, options });
    },

    openAsset(asset: AssetProps, options?: NavigatorAPIOptions) {
      return openEntity({ entity: asset, options });
    },
    onSlideInNavigation,
    openBulkEditor,
    openAppConfig: () => navigateToAppConfig(options),
    openCurrentAppPage(options?: AppPageLocationOptions) {
      return navigateTo({ ...options, type: WidgetNamespace.APP });
    },
    openEntry<Field>(entry: EntryProps<Field>, options?: NavigatorAPIOptions) {
      return openEntity({ entity: entry, options });
    },
    openPageExtension(options?: PageExtensionOptions) {
      return navigateTo({ ...options, type: WidgetNamespace.EXTENSION });
    },
  };
}
