import DataLoader from 'dataloader';
import { uniq, get, identity } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './WidgetTypes';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from './WidgetNamespaces';

const CUSTOM_NAMESPACES = [NAMESPACE_EXTENSION, NAMESPACE_APP];

// A key is a namespace + ID pair, as an array.
const cacheKeyFn = ([ns, id]) => [ns, id].join(',');

export function createCustomWidgetLoader(cma, appsRepo) {
  const loader = new DataLoader(load, { cacheKeyFn });

  return {
    getByKeys,
    getForEditor,
    evict,
    getUncachedForListing
  };

  // Fetcher function used by DataLoader.
  // Keys are pairs of `[namespace, id]`, for example:
  // `[ ['extension', 'test'], ['app', 'some-app'] ]`.
  async function load(keys) {
    if (!Array.isArray(keys) || keys.length < 1) {
      return [];
    }

    const extensionIds = keys
      .filter(([namespace]) => namespace === NAMESPACE_EXTENSION)
      .map(([, id]) => id);
    const emptyExtensionsRes = () => Promise.resolve({ items: [] });
    const fetchExtensions =
      extensionIds.length > 0
        ? () => cma.getExtensions({ 'sys.id[in]': extensionIds.join(',') })
        : emptyExtensionsRes;

    const [{ items: extensions }, apps] = await Promise.all([
      // If widgets cannot be fetched, we prefer to present the
      // "widget missing" message in the entry editor rather than
      // crashing the whole Web App or disallowing editing.
      fetchExtensions().catch(emptyExtensionsRes),
      appsRepo.getOnlyInstalledApps().catch(() => [])
    ]);

    return keys.map(([namespace, id]) => {
      if (namespace === NAMESPACE_APP) {
        const app = apps.find(app => get(app, ['appDefinition', 'sys', 'id']) === id);

        return app ? buildAppWidget(app) : null;
      }

      if (namespace === NAMESPACE_EXTENSION) {
        const ext = extensions.find(ext => get(ext, ['sys', 'id']) === id);

        return ext ? buildExtensionWidget(ext) : null;
      }

      return null;
    });
  }

  // Given a list of keys of widgets (either an app or extension)
  // returns a list of widgets. If there is no widget for a key,
  // it is omitted in the result set.
  //
  // While this method is used, a cache is built up. Once cached
  // widgets will be used until the current space/environment
  // changes or `evict` is called.
  //
  // Note this method is intended to be used to load widgets
  // for entity editors where for performance reasons we can live
  // with slightly outdated widgets being rendered.
  async function getByKeys(keys) {
    const uniqKeys = uniq(keys, cacheKeyFn);
    const widgets = await loader.loadMany(uniqKeys);

    return widgets.filter(identity);
  }

  // Given an instance of EditorInterface entity produced by
  // `EditorInterfaceTransformer` extracts all used custom
  // widget keys and calls `getByKeys` with them.
  function getForEditor(editorInterface) {
    const controls = get(editorInterface, ['controls'], []);
    const sidebar = get(editorInterface, ['sidebar'], []);
    const editor = get(editorInterface, ['editor'], {});

    const customWidgetKeys = [...controls, ...sidebar, editor]
      .filter(({ widgetNamespace }) => CUSTOM_NAMESPACES.includes(widgetNamespace))
      .filter(({ widgetId }) => typeof widgetId === 'string' && widgetId.length > 0)
      .map(({ widgetNamespace, widgetId }) => [widgetNamespace, widgetId]);

    return getByKeys(customWidgetKeys);
  }

  // Removes a widget from the cache.
  // Use when an app or extension is modified or removed.
  function evict(key) {
    loader.clear(key);
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
