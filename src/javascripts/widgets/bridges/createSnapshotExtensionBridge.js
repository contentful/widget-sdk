import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import makeExtensionAccessHandlers from './makeExtensionAccessHandlers';
import checkDependencies from './checkDependencies';
import { LOCATION_ENTRY_FIELD } from '../WidgetLocations';
import TheLocaleStore from 'services/localeStore';
import { getModule } from 'core/NgRegistry';

// This is a UI Extension bridge to be used in the version
// comparison view. It provides static initial data,
// doesn't notify UI Extensions about changes and doesn't
// handle any messages but non-mutating CMA calls.
export default function createSnapshotExtensionBridge(dependencies) {
  const spaceContext = getModule('spaceContext');
  const { field, locale, entity, editorData } = checkDependencies(
    'SnapshotExtensionBridge',
    dependencies,
    ['field', 'locale', 'entity', 'editorData']
  );

  return {
    getData,
    install,
    uninstall: () => {},
    apply: () => {}, // No matter what - don't apply changes
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: LOCATION_ENTRY_FIELD,
      spaceMember: spaceContext.space.data.spaceMember,
      current: { field, locale },
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale(),
      },
      entryData: entity,
      contentTypeData: editorData.contentType.data,
      initialContentTypesData: spaceContext.publishedCTs.getAllBare(),
      editorInterface: editorData.editorInterface,
    };
  }

  function install(api) {
    api.registerHandler(
      'callSpaceMethod',
      makeExtensionSpaceMethodsHandlers({ ...dependencies, spaceContext }, { readOnly: true })
    );

    api.registerHandler('checkAccess', makeExtensionAccessHandlers());
  }
}
