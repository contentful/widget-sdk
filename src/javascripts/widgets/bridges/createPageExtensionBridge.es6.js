import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import makePageExtensionHandlers from './makePageExtensionHandlers.es6';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers.es6';
import checkDependencies from './checkDependencies.es6';
import { LOCATION_PAGE } from '../WidgetLocations.es6';
import TheLocaleStore from 'services/localeStore.es6';

export default function createPageExtensionBridge(dependencies, currentExtensionId) {
  const { $rootScope, spaceContext } = checkDependencies('PageExtensionBridge', dependencies, [
    '$rootScope',
    'spaceContext'
  ]);

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
    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));

    api.registerHandler(
      'navigateToContentEntity',
      makeExtensionNavigationHandlers(dependencies, { disableSlideIn: true })
    );

    api.registerHandler(
      'navigateToPageExtension',
      makePageExtensionHandlers(dependencies, currentExtensionId, true)
    );
  }
}
