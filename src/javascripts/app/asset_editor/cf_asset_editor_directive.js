angular.module('contentful').directive('cfAssetEditor', [
  'require',
  require => {
    const createEditorController = require('app/entity_editor/AssetController').default;
    return {
      restrict: 'E',
      scope: {
        assetId: '<',
        preferences: '<'
      },
      template: JST.asset_editor(),
      controller: ['$scope', $scope => createEditorController($scope, $scope.assetId)]
    };
  }
]);
