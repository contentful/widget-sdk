import { registerDirective } from 'core/NgRegistry';
import assetListDirective from './asset_list.html';

export default function register() {
  registerDirective('cfAssetList', () => ({
    template: assetListDirective,
    restrict: 'A',
    controller: 'AssetListController',
  }));
}
