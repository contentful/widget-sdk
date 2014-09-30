'use strict';

angular.module('contentful').controller('AssetLinkEditorController', ['$scope', '$controller', '$attrs', function ($scope, $controller, $attrs) {
  return $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: $attrs.cfLinkEditor,
      multiple: $attrs.linkMultiple
    }
  });

}]);
