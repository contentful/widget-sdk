import * as TokenStore from 'services/TokenStore.es6';

export const spaceResolver = [
  '$q',
  '$stateParams',
  async ($q, $stateParams) => {
    const deferred = $q.defer();
    const spaceId = $stateParams.spaceId;
    const space = await TokenStore.getSpace(spaceId);

    deferred.resolve(space);

    return deferred.promise;
  }
];
