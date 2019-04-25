import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import { LOCATION_ENTRY_FIELD } from '../WidgetLocations.es6';

const REQUIRED_DEPENDENCIES = ['$scope', 'spaceContext', 'TheLocaleStore'];

// This is a UI Extension bridge to be used in the version
// comparison view. It provides static initial data,
// doesn't notify UI Extensions about changes and doesn't
// handle any messages but non-mutating CMA calls.
export default function createSnapshotExtensionBridge(dependencies) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $scope, spaceContext, TheLocaleStore } = dependencies;

  return {
    getData,
    install,
    apply: () => {} // No matter what - don't apply changes
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
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
      contentTypeData: $scope.entityInfo.contentType,
      editorInterface: $scope.editorData.editorInterface
    };
  }

  function install(api) {
    api.registerHandler(
      'callSpaceMethod',
      makeExtensionSpaceMethodsHandlers(dependencies, { readOnly: true })
    );
  }
}
