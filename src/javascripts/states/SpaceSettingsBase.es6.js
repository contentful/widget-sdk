import Base from 'states/Base.es6';
import { go } from 'states/Navigator.es6';
import * as TokenStore from 'services/TokenStore.es6';

export async function redirectReadOnlySpace(spaceId) {
  const _space = await TokenStore.getSpace(spaceId);

  // if (org.readOnlyAt) {
  go({
    path: ['home']
  });
  // }
}

export default function SpaceSettingsBase(definition) {
  const defaults = {
    onEnter: [
      '$stateParams',
      async $stateParams => {
        const spaceId = $stateParams.spaceId;
        return await redirectReadOnlySpace(spaceId);
      }
    ]
  };

  return Base(Object.assign(defaults, definition));
}
