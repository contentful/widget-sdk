import DataLoader from 'dataloader';
import { get, identity, pick } from 'lodash';

// TODO: This shouldn't be called "ExtensionLoader".
//
// It's actually "CustomWidgetLoader", loading both UIE and App
// widgets for rendering in the Web App.
//
// The output value should be actually "widget" data structures,
// (now produced inside of `WidgetStore`) instead of `Extension`s.

// Creates an artifical extension for an app so it can be consumed
// by all rendering logic for UI Extensions.
function buildAppExtension({ title, appInstallation, appDefinition }) {
  return {
    sys: { type: 'Extension', id: appInstallation.sys.widgetId },
    extension: {
      ...pick(appDefinition, ['src', 'fieldTypes', 'locations']),
      name: title
    },
    parameters: appInstallation.parameters
  };
}

export function createExtensionLoader(cma, appsRepo) {
  const extensionLoader = new DataLoader(async extensionIds => {
    if (!Array.isArray(extensionIds) || extensionIds.length < 1) {
      return [];
    }

    let extensions;
    try {
      const { items } = await cma.getExtensions({
        'sys.id[in]': extensionIds.join(',')
      });

      // TODO: filter on the API side.
      extensions = items.filter(e => !!e.extension);
    } catch (err) {
      // If extensions cannot be fetched, we prefer to show
      // "extension missing" message in entry editor rather
      // than crashing the whole Web App or disallowing editing.
      extensions = [];
    }

    const loadedExtensions = extensionIds.map(id => {
      return extensions.find(e => get(e, ['sys', 'id']) === id) || null;
    });

    // If all requested IDs were loaded from the /extensions
    // endpoint. If so, return results.
    const loadedAll = loadedExtensions.every(identity);
    if (loadedAll) {
      return loadedExtensions;
    }

    // If not, we fetch apps and convert them to artifical
    // extensions for rendering (with `buildAppExtension`).
    //
    // In the future we could fetch from both /extensions
    // and /app_installations in parallel but getting apps
    // takes longer than extensions and right now most of people
    // don't use apps so we do it serially not to penalize
    // them. Once apps are used more often we need to optimize
    // AppInstallation fetching (AppDefinition should be in
    // `includes` so we do only 1 HTTP request) and fire
    // these calls in parallel.
    let apps;
    try {
      apps = await appsRepo.getApps();
    } catch (err) {
      // Extension logic for recovery applies.
      apps = [];
    }

    return extensionIds.map((id, i) => {
      if (loadedExtensions[i]) {
        return loadedExtensions[i];
      }

      const app = apps.find(app => {
        return get(app, ['appInstallation', 'sys', 'widgetId']) === id;
      });

      return app ? buildAppExtension(app) : null;
    });
  });

  return {
    // Given a list of IDs the `getExtensionsById` method returns
    // a list of Extension entities with provided IDs. If there
    // is no Extension for an ID, it is omitted in the result set.
    //
    // While the method is used, the cache is build up. Once cached
    // extension will be used until the current space/environment
    // changes or `evictExtension` is called.
    //
    // Please note this method is intended to be used to load
    // extensions for entity editors where for performance reasons
    // we can live with slightly outdated extensions being rendered.
    getExtensionsById: async extensionIds => {
      const result = await extensionLoader.loadMany(extensionIds);

      return result.filter(identity);
    },
    // Removes an extension from the cache.
    // Use when an extension is modified or removed.
    evictExtension: id => {
      extensionLoader.clear(id);
    }
  };
}
