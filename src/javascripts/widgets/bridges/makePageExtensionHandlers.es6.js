export default function makePageExtensionHandlers(
  { spaceContext, Navigator },
  currentExtensionId,
  isOnPageExtensionPage = false
) {
  return async function navigate(options) {
    const { extensionId, path } = options;

    if (!extensionId) {
      throw new Error('The `extensionId` option is required!');
    }

    if (path && !path.startsWith('/')) {
      throw new Error('The `path` option must start with a slash!');
    }

    const navigatingToNewExtensionPage = currentExtensionId !== extensionId;

    await Navigator.go({
      path: ['spaces', 'detail', 'pageExtensions'],
      params: {
        spaceId: spaceContext.cma.spaceId,
        extensionId,
        path
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
