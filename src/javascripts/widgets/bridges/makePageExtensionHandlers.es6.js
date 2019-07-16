import checkDependencies from './checkDependencies.es6';

export default function makePageExtensionHandlers(
  dependencies,
  currentExtensionId,
  isOnPageExtensionPage = false
) {
  const { spaceContext, Navigator } = checkDependencies('PageExtensionHandlers', dependencies, [
    'spaceContext',
    'Navigator'
  ]);

  return async function navigate(options = {}) {
    const { id, path } = options;

    if (!id) {
      throw new Error('The `id` option is required!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const navigatingToNewExtensionPage = currentExtensionId !== id;

    await Navigator.go({
      path: ['spaces', 'detail']
        .concat(spaceContext.isMasterEnvironment() ? [] : ['environment'])
        .concat(['pageExtensions']),
      params: {
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        extensionId: id,
        path: path || ''
      },
      options: {
        // If we are navigating to a new extension page OR we are not on the extension page,
        // we want to notify a state change of the URL. Otherwise, do NOT notify a state change
        // to ensure that the iframe on the page extension page doesn't reload.
        notify: navigatingToNewExtensionPage || !isOnPageExtensionPage
      }
    });

    return { navigated: true, path };
  };
}
