import Base from 'states/Base.es6';
import { go } from 'states/Navigator.es6';
import * as TokenStore from 'services/TokenStore.es6';

export function redirectReadOnlySpace(space) {
  if (space.readOnlyAt) {
    go({
      path: ['home']
    });
  }
}

export default function SpaceSettingsBase(definition) {
  const defaults = {
    resolve: {
      space: [
        '$q',
        '$stateParams',
        async function($q, $stateParams) {
          const deferred = $q.defer();
          const spaceId = $stateParams.spaceId;

          const _space = await TokenStore.getSpace(spaceId);
          deferred.resolve(_space);

          return deferred.promise;
        }
      ]
    },
    onEnter: ['space', space => redirectReadOnlySpace(space)]
  };

  return Base(Object.assign(defaults, definition));
}
