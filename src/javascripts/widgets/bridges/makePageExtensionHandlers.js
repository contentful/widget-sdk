import checkDependencies from './checkDependencies';
import * as Navigator from 'states/Navigator';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from '../WidgetNamespaces';

const SUPPORTED_WIDGET_NAMESPACE_ROUTES = {
  [NAMESPACE_EXTENSION]: {
    path: ['pageExtensions'],
    paramId: 'extensionId',
  },
  [NAMESPACE_APP]: {
    path: ['apps', 'page'],
    paramId: 'appId',
  },
};

export default function makePageExtensionHandlers(dependencies, isCurrentlyOnPageLocation = false) {
  const {
    spaceContext,
    currentWidgetId,
    currentWidgetNamespace,
  } = checkDependencies('PageExtensionHandlers', dependencies, [
    'spaceContext',
    'currentWidgetId',
    'currentWidgetNamespace',
  ]);

  return async function navigate(options = {}) {
    const { id, path, type = NAMESPACE_EXTENSION } = options;
    const isApp = type === NAMESPACE_APP;

    if (!id) {
      throw new Error('The `id` option is required!');
    }

    if (currentWidgetNamespace !== type) {
      throw new Error('Cannot navigate between different widget types!');
    }

    if (!Object.keys(SUPPORTED_WIDGET_NAMESPACE_ROUTES).includes(type)) {
      throw new Error(`Unsupported type "${type}" was given!`);
    }

    if (isApp && currentWidgetId !== id) {
      throw new Error('The current ID does not match the ID of the app!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const isNavigatingToNewContext = currentWidgetId !== id;
    const widgetRouting = SUPPORTED_WIDGET_NAMESPACE_ROUTES[currentWidgetNamespace];

    await Navigator.go({
      path: ['spaces', 'detail']
        .concat(spaceContext.isMasterEnvironment() ? [] : ['environment'])
        .concat(widgetRouting.path),
      params: {
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        [widgetRouting.paramId]: id,
        path: path || '',
      },
      options: {
        // If we are navigating to a new extension page OR we are not on the extension page,
        // we want to notify a state change of the URL. Otherwise, do NOT notify a state change
        // to ensure that the iframe on the page extension page doesn't reload.
        notify: isNavigatingToNewContext || !isCurrentlyOnPageLocation,
      },
    });

    return { navigated: true, path };
  };
}
