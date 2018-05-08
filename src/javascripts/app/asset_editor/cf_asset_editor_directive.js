angular.module('contentful').directive('cfAssetEditor', [
  'require',
  function (require) {
    var createEditorController = require('app/entity_editor/AssetController')
      .default;
    return {
      restrict: 'E',
      scope: {
        assetId: '<',
        preferences: '<'
      },
      template: JST.asset_editor(),
      controller: [
        '$scope',
        function ($scope) {
          return createEditorController($scope, $scope.assetId);
        }
      ]
    };
  }
]);
