import makeExtensionSpaceMethodsHandler from './ExtensionSpaceMethodsHandler.es6';
import { LOCATION_ENTRY_FIELD } from '../WidgetLocations.es6';

// This is a UI Extension bridge to be used in the version
// comparison view. It provides static initial data,
// doesn't notify UI Extensions about changes and doesn't
// handle any messages but non-mutating CMA calls.
export default function createBridge(dependencies) {
  const { $scope, spaceContext, TheLocaleStore } = dependencies;
  return {
    getData,
    install,
    apply: () => {} // No matter what - don't apply changes
  };

  function getData() {
    return {
      location: LOCATION_ENTRY_FIELD,
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: {
        field: $scope.widget.field,
        locale: $scope.locale
      },
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.entity,
      contentTypeData: $scope.entityInfo.contentType
    };
  }

  function install(api) {
    api.registerHandler(
      'callSpaceMethod',
      makeExtensionSpaceMethodsHandler(dependencies, { readOnly: true })
    );
  }
}
