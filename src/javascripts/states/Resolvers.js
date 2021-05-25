import * as TokenStore from 'services/TokenStore';

export const spaceResolver = [
  '$stateParams',
  async ($stateParams) => {
    const spaceId = $stateParams.spaceId;
    return TokenStore.getSpace(spaceId);
  },
];
