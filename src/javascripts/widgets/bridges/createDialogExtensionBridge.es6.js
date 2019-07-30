import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import makePageExtensionHandlers from './makePageExtensionHandlers.es6';
import checkDependencies from './checkDependencies.es6';
import { LOCATION_DIALOG } from '../WidgetLocations.es6';
import TheLocaleStore from 'services/localeStore.es6';

export default function createDialogExtensionBridge(dependencies, openDialog, onClose) {
  const { spaceContext } = checkDependencies('DialogExtensionBridge', dependencies, [
    'spaceContext'
  ]);

  return {
    getData,
    install,
    apply: fn => fn()
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: LOCATION_DIALOG,
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
    api.registerHandler('closeDialog', onClose);
    api.registerHandler('openDialog', openDialog);
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('navigateToPageExtension', makePageExtensionHandlers(dependencies));

    api.registerHandler(
      'navigateToContentEntity',
      makeExtensionNavigationHandlers(dependencies, { disableSlideIn: true })
    );
  }
}
