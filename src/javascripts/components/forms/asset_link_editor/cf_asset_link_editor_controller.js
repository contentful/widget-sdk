'use strict';

angular.module('contentful').controller('AssetLinkEditorController', [
  '$scope', '$attrs', '$injector', function ($scope, $attrs, $injector) {

  var $controller = $injector.get('$controller');
  $scope.$state   = $injector.get('$state');

  $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Asset',
      fetchMethod: 'getAssets',
      validationType: 'linkMimetypeGroup',
      multiple: $attrs.linkMultiple
    },
    setValidationType: function (mimetypeValidation) {
      if (!mimetypeValidation) {
        $scope.linkMimetypeGroup = null;
        return;
      }

      var groupNames = mimetypeValidation.mimetypeGroupName;
      if (_.isString(groupNames))
        groupNames = [groupNames];
      $scope.linkMimetypeGroup = groupNames;
    }
  });
}]);
