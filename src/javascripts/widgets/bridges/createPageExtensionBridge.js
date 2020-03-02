import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers';
import checkDependencies from './checkDependencies';
import { LOCATION_PAGE } from '../WidgetLocations';
import TheLocaleStore from 'services/localeStore';

export default function createPageExtensionBridge(dependencies, currentExtensionId) {
  const { spaceContext } = checkDependencies('PageExtensionBridge', dependencies, ['spaceContext']);

  return {
    getData,
    install,
    apply: fn => fn()
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
      initialContentTypesData: spaceContext.publishedCTs.getAllBare(),
      editorInterface: undefined
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

    api.registerHandler(
      'navigateToPageExtension',
      makePageExtensionHandlers(dependencies, currentExtensionId, true)
    );
  }
}
