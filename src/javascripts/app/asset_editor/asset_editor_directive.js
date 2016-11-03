'use strict';

angular.module('contentful').directive('cfAssetEditor', [function () {
  return {
    template: JST.asset_editor(),
    restrict: 'E',
    controller: 'AssetEditorController',
    controllerAs: 'editorContext'
  };
}]);
