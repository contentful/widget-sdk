'use strict';

angular.module('contentful').controller('EntryLinkEditorController', ['$scope', '$controller', '$attrs', function ($scope, $controller, $attrs) {
  return $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Entry',
      fetchMethod: 'getEntries',
      validationType: 'linkContentType',
      multiple: $attrs.linkMultiple
    }
  });

}]);
