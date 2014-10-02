'use strict';

angular.module('contentful').controller('AssetLinkEditorController', ['$scope', '$controller', '$attrs', function ($scope, $controller, $attrs) {
  return $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Asset',
      fetchMethod: 'getAssets',
      validationType: 'linkMimetypeGroup',
      multiple: $attrs.linkMultiple
    }
  });

}]);
