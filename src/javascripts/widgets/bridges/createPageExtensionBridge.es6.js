import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import makePageExtensionHandlers from './makePageExtensionHandlers.es6';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers.es6';
import { LOCATION_PAGE } from '../WidgetLocations.es6';

const REQUIRED_DEPENDENCIES = [
  '$rootScope',
  'spaceContext',
  'TheLocaleStore',
  'Navigator',
  'entitySelector'
];

export default function createPageExtensionBridge(dependencies, currentExtensionId) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $rootScope, spaceContext, TheLocaleStore } = dependencies;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: LOCATION_PAGE,
      spaceMember: spaceContext.space.data.spaceMember,
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: { sys: {}, fields: {} },
      contentTypeData: { sys: {}, fields: [] },
      editorInterface: undefined
    };
  }

  function install(api) {
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler(
      'navigateToPageExtension',
      makePageExtensionHandlers(dependencies, currentExtensionId, true)
    );

    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));

    const navigationHandler = makeExtensionNavigationHandlers(dependencies);
    api.registerHandler('navigateToContentEntity', async options => {
      if (options.slideIn === true) {
        throw new Error('Cannot open the slide-in editor from a page extension.');
      } else {
        return navigationHandler(options);
      }
    });
  }
}
