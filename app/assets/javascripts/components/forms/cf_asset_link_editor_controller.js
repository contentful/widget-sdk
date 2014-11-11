'use strict';

angular.module('contentful').controller('AssetLinkEditorController', ['$scope', '$attrs', '$controller', function ($scope, $attrs, $controller) {
  $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Asset',
      fetchMethod: 'getAssets',
      validationType: 'linkMimetypeGroup',
      multiple: $attrs.linkMultiple
    },
    setValidationType: function (linkTypeValidation) {
      $scope.linkMimetypeGroup = linkTypeValidation.mimetypeGroupName;
    }
  });

}]);
