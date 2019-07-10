export default function makePageExtensionHandlers(
  { spaceContext, Navigator },
  currentExtensionId,
  isOnPageExtensionPage = false
) {
  return async function navigate(options = {}) {
    const { id, path } = options;

    if (!id) {
      throw new Error('The `id` option is required!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const navigatingToNewExtensionPage = currentExtensionId !== id;
    const envId = spaceContext.getEnvironmentId();

    await Navigator.go({
      path: ['spaces', 'detail'].concat(envId && envId !== 'master' ? ['environment'] : [], [
        'pageExtensions'
      ]),
      params: {
        spaceId: spaceContext.cma.spaceId,
        environmentId: envId,
        extensionId: id,
        path: path || ''
      },
      options: {
        // if we are navigating to a new extension page OR we are not on the extension page, we want to notify a state change of the URL
        // otherwise, do NOT notify a state change to ensure that the iframe on the page extension page doesn't reload
        notify: navigatingToNewExtensionPage || !isOnPageExtensionPage
      }
    });

    return { navigated: true, path };
  };
}
