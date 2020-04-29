import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import { makeExtensionNavigationHandlers } from './makeExtensionNavigationHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import makeExtensionAccessHandlers from './makeExtensionAccessHandlers';
import checkDependencies from './checkDependencies';
import { LOCATION_DIALOG } from '../WidgetLocations';
import TheLocaleStore from 'services/localeStore';

export default function createDialogExtensionBridge(dependencies, openDialog, onClose) {
  const { spaceContext } = checkDependencies('DialogExtensionBridge', dependencies, [
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
      location: LOCATION_DIALOG,
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
    api.registerHandler('closeDialog', onClose);
    api.registerHandler('openDialog', openDialog);
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('navigateToPageExtension', makePageExtensionHandlers(dependencies));
    api.registerHandler('navigateToPage', makePageExtensionHandlers(dependencies));
    api.registerHandler('checkAccess', makeExtensionAccessHandlers());

    api.registerHandler(
      'navigateToContentEntity',
      makeExtensionNavigationHandlers(dependencies.spaceContext, { disableSlideIn: true })
    );
  }
}
