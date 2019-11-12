import { registerDirective } from 'NgRegistry';

export default function register() {
  registerDirective('cfAssetList', () => ({
    template: JST.asset_list(),
    restrict: 'A',
    controller: 'AssetListController'
  }));
}
