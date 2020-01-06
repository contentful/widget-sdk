import DataLoader from 'dataloader';
import { uniq, get, identity } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './WidgetTypes';
import { NAMESPACE_EXTENSION } from './WidgetNamespaces';

export function createCustomWidgetLoader(cma, appsRepo) {
  const loader = new DataLoader(loadByIds);

  return {
    getByIds,
    getForEditor,
    evict,
    getUncachedForListing
  };

  // Fetcher function used by DataLoader.
  async function loadByIds(ids) {
    if (!Array.isArray(ids) || ids.length < 1) {
      return [];
    }

    const [{ items: extensions }, apps] = await Promise.all([
      // If widgets cannot be fetched, we prefer to present the
      // "widget missing" message in the entry editor rather than
      // crashing the whole Web App or disallowing editing.
      cma.getExtensions({ 'sys.id[in]': ids.join(',') }).catch(() => ({ items: [] })),
      appsRepo.getOnlyInstalledApps().catch(() => [])
    ]);

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

  // Given an instance of EditorInterface entity produced by
  // `EditorInterfaceTransformer` extracts all used custom
  // widget IDs and calls `getByIds` with them.
  function getForEditor(editorInterface) {
    const controls = get(editorInterface, ['controls'], []);
    const sidebar = get(editorInterface, ['sidebar'], []);
    const editor = get(editorInterface, ['editor'], {});

    const customWidgetIds = [...controls, ...sidebar, editor]
      .filter(widget => widget.widgetNamespace === NAMESPACE_EXTENSION)
      .map(widget => widget.widgetId)
      .filter(widgetId => typeof widgetId === 'string' && widgetId.length > 0);

    return getByIds(uniq(customWidgetIds));
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
      .then(({ items }) => items.map(buildExtensionWidget))
      .catch(() => []);

    const [appWidgets, extensionWidgets] = await Promise.all([appsPromise, extensionsPromise]);

    return appWidgets.concat(extensionWidgets);
  }
}
