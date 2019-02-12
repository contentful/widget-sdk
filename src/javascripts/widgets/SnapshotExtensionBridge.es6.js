// This is a UI Extension bridge to be used in the version
// comparison view. It provides static initial data,
// doesn't notify UI Extensions about changes and doesn't
// handle any messages but non-mutating CMA calls.
export default function createBridge({ $scope, spaceContext, TheLocaleStore }) {
  return {
    getData,
    install,
    apply: () => {} // No matter what - don't apply changes
  };

  function getData() {
    return {
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: {
        field: $scope.widget.field,
        locale: $scope.locale
      },
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.entity,
      contentTypeData: $scope.entityInfo.contentType
    };
  }

  function install(api) {
    api.registerHandler('callSpaceMethod', async (methodName, args) => {
      if (typeof methodName !== 'string' || !methodName.startsWith('get')) {
        throw new Error('Cannot modify data when comparing versions.');
      }

      try {
        return await spaceContext.cma[methodName](...args);
      } catch ({ code, body }) {
        const err = new Error('Request failed.');
        throw Object.assign(err, { code, data: body });
      }
    });
  }
}
