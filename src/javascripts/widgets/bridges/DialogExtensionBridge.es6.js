import makeExtensionSpaceMethodsHandler from './ExtensionSpaceMethodsHandler.es6';
import makeExtensionNavigationHandler from './ExtensionNavigationHandler.es6';
import makeExtensionNotificationHandler from './ExtensionNotificationHandler.es6';
import { LOCATION_DIALOG } from '../WidgetLocations.es6';

export default function createBridge(dependencies, openDialog, onClose) {
  const { $rootScope, spaceContext, TheLocaleStore } = dependencies;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      location: LOCATION_DIALOG,
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: { sys: {}, fields: {} },
      contentTypeData: { sys: {}, fields: [] }
    };
  }

  function install(api) {
    api.registerHandler('closeDialog', onClose);

    api.registerHandler('openDialog', openDialog);
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandler(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandler(dependencies));

    const navigationHandler = makeExtensionNavigationHandler(dependencies);
    api.registerHandler('navigateToContentEntity', async options => {
      if (options.slideIn === true) {
        throw new Error('Cannot open the slide-in editor from a dialog.');
      } else {
        return navigationHandler(options);
      }
    });
  }
}
