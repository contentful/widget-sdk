import DataLoader from 'dataloader';
import { get, identity } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './WidgetTypes';

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

    const [extensionsResponse, apps] = await Promise.all([
      // If widgets cannot be fetched, we prefer to present the
      // "widget missing" message in the entry editor rather than
      // crashing the whole Web App or disallowing editing.
      cma.getExtensions({ 'sys.id[in]': ids.join(',') }).catch(() => ({ items: [] })),
      appsRepo.getOnlyInstalledApps().catch(() => [])
    ]);

    // TODO: filter should be removed when we move `/extensions`
    // to extensibility-api (it happens on the API side there).
    const extensions = extensionsResponse.items.filter(e => !!e.extension);

    return ids.map(id => {
      const extension = extensions.find(extension => {
        return get(extension, ['sys', 'id']) === id;
      });

      if (extension) {
        return buildExtensionWidget(extension);
      }

      // TODO: we use "extension" namespace in EditorInterface and fall
      // back to apps if an extension is not found. We should introduce
      // a new namespace specifically for apps.
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
  // While this method is used, a cache is built up. Once cached
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
  // Widgets can be used ONLY for listing in places
  // like Field appearance or sidebar settings.
  // `srcdoc` is not included in extension widgets so they
  // cannot be rendered in `<iframe>`s.
  async function getUncachedForListing() {
    const appsPromise = appsRepo
      .getOnlyInstalledApps()
      .then(apps => apps.map(buildAppWidget))
      .catch(() => []);

    const extensionsPromise = cma
      .getExtensionsForListing()
      // TODO: drop the filter once we fully migrate to the new `/extensions` endpoint.
      .then(({ items }) => (items || []).filter(e => !!e.extension).map(buildExtensionWidget))
      .catch(() => []);

    const [appWidgets, extensionWidgets] = await Promise.all([appsPromise, extensionsPromise]);

    return appWidgets.concat(extensionWidgets);
  }
}
