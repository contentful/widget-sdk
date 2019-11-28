import DataLoader from 'dataloader';
import { get, identity } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './WidgetTypes';

// TODO: test this module.

export function createCustomWidgetLoader(cma, appsRepo) {
  const loader = new DataLoader(loadByIds);

  return {
    getByIds,
    evict,
    getUncachedForListing
  };

  // Fetcher function used by DataLoader.
  async function loadByIds(ids) {
    if (!Array.isArray(ids) || ids.length < 1) {
      return [];
    }

    let extensions;
    try {
      const { items } = await cma.getExtensions({ 'sys.id[in]': ids.join(',') });

      // TODO: filter should be removed when we move `/extensions`
      // to extensibility-api (it happens on the API side there).
      extensions = items.filter(e => !!e.extension);
    } catch (err) {
      // If extensions cannot be fetched, we prefer to show
      // "extension missing" message in entry editor rather
      // than crashing the whole Web App or disallowing editing.
      extensions = [];
    }

    const loadedExtensions = ids.map(id => {
      const extension = extensions.find(extension => {
        return get(extension, ['sys', 'id']) === id;
      });

      return extension ? buildExtensionWidget(extension) : null;
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

    return ids.map((id, i) => {
      if (loadedExtensions[i]) {
        return loadedExtensions[i];
      }

      const app = apps.find(app => {
        return get(app, ['appInstallation', 'sys', 'widgetId']) === id;
      });

      return app ? buildAppWidget(app) : null;
    });
  }

  // Given a list of IDs of widgets (either an app or extension)
  // returns a list of widgets. If there is no widget for an ID,
  // it is omitted in the result set.
  //
  // While this method is used, a cache is build up. Once cached
  // widgets will be used until the current space/environment
  // changes or `evict` is called.
  //
  // Note this method is intended to be used to load widgets
  // for entity editors where for performance reasons we can live
  // with slightly outdated widgets being rendered.
  async function getByIds(ids) {
    const widgets = await loader.loadMany(ids);

    return widgets.filter(identity);
  }

  // Removes a widget from the cache.
  // Use when an app or extension is modified or removed.
  function evict(id) {
    loader.clear(id);
  }

  // Gets a list of all available widgets.
  // The list is not cached (HTTP is done every time).
  //
  // Widgets fetched can be used for listing/management
  // only (`srcdoc` not included in extension widgets),
  // not for rendering of `<iframe>`s.
  function getUncachedForListing() {
    const widgets = {};

    return new Promise(resolve => {
      // We want to fire both HTTP calls at the same time
      // and do them in parallel but allow them to fail and
      // be handled separately. For this reason we're not
      // using `Promise.all()`.
      const done = result => {
        Object.assign(widgets, result);
        if (Array.isArray(widgets.extension) && Array.isArray(widgets.app)) {
          // List apps before extensions!
          resolve(widgets.app.concat(widgets.extension));
        }
      };

      cma
        .getExtensionsForListing()
        .then(({ items }) =>
          done({
            // TODO: filter should be removed when we move `/extensions`
            // to extensibility-api (it happens on the API side there).
            extension: (items || []).filter(e => !!e.extension).map(buildExtensionWidget)
          })
        )
        .catch(() => done({ extension: [] }));

      appsRepo
        .getApps()
        .then(apps =>
          done({
            app: (apps || []).filter(app => !!app.appInstallation).map(buildAppWidget)
          })
        )
        .catch(() => done({ app: [] }));
    });
  }
}
