import { assetDetail } from 'app/entity_editor/cfSlideInEditor';
import { AssetView } from '../AssetView';

const list = {
  name: 'list',
  url: '',
  component: AssetView,
};

export const assetViewState = {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [list, assetDetail()],
};
