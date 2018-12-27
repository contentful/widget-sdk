import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfAssetList', () => ({
  template: JST.asset_list(),
  restrict: 'A',
  controller: 'AssetListController'
}));
