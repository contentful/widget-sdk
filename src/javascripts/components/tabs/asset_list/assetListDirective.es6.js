import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfAssetList', () => ({
    template: JST.asset_list(),
    restrict: 'A',
    controller: 'AssetListController'
  }));
}
