import { assetDetail } from 'app/entity_editor/cfSlideInEditor';
import { assetListState } from './AssetListRouter';

export const assetViewState = {
  name: 'assets',
  url: '/assets',
  abstract: true,
  children: [assetListState, assetDetail()],
};
