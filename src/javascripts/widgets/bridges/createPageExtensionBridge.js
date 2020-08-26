import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import { makeExtensionNavigationHandlers } from './makeExtensionNavigationHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers';
import makeExtensionAccessHandlers from './makeExtensionAccessHandlers';
import checkDependencies from './checkDependencies';
import TheLocaleStore from 'services/localeStore';
import { WidgetLocation } from '@contentful/widget-renderer';

export default function createPageExtensionBridge(dependencies) {
  const { spaceContext } = checkDependencies('PageExtensionBridge', dependencies, [
    'spaceContext',
    'currentWidgetId',
    'currentWidgetNamespace',
  ]);

  return {
    getData,
    install,
    uninstall: () => {},
    apply: (fn) => fn(),
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: WidgetLocation.PAGE,
      spaceMember: spaceContext.space.data.spaceMember,
      current: null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale(),
      },
      entryData: { sys: {}, fields: {} },
      contentTypeData: { sys: {}, fields: [] },
      initialContentTypesData: spaceContext.publishedCTs.getAllBare(),
      editorInterface: undefined,
    };
  }

  function install(api) {
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));

    api.registerHandler(
      'navigateToContentEntity',
      makeExtensionNavigationHandlers(dependencies.spaceContext, { disableSlideIn: true })
    );

    api.registerHandler('navigateToPageExtension', makePageExtensionHandlers(dependencies, true));
    api.registerHandler('navigateToPage', makePageExtensionHandlers(dependencies, true));
    api.registerHandler('checkAccess', makeExtensionAccessHandlers());
  }
}
