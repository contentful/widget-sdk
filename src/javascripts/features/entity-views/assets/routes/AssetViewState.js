import { assetDetail } from 'app/entity_editor/cfSlideInEditor';
import { AssetView } from '../AssetView';

const list = {
  name: 'list',
  url: '',
  mapInjectedToProps: [
    '$state',
    ($state) => {
      return {
        goTo: (assetId) => {
          // X.list -> X.detail
          $state.go('^.detail', { assetId });
        },
      };
    },
  ],
  component: AssetView,
};

export const assetViewState = {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, assetDetail()],
};
