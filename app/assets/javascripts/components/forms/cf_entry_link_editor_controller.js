'use strict';

angular.module('contentful').controller('EntryLinkEditorController', ['$scope', '$attrs', '$controller', function ($scope, $attrs, $controller) {
  return $controller('LinkEditorController', {
    $scope: $scope,
    ngModel: $attrs.ngModel,
    linkParams: {
      type: 'Entry',
      fetchMethod: 'getEntries',
      validationType: 'linkContentType',
      multiple: $attrs.linkMultiple
    },
    setValidationType: function (linkTypeValidation) {
      $scope.linkContentTypes = _(linkTypeValidation.contentTypeId)
        .map(function (id) { return $scope.spaceContext.getPublishedContentType(id); })
        .compact()
        .value();
      // TODO This means the validation contains unpublished content  types.
      // It should never happen but I don't know how to deal with it here
      if ($scope.linkContentTypes.length === 0) $scope.linkContentTypes = null;
    },
    getLinkDescription: function (entity) {
      return $scope.spaceContext.entryTitle(entity, $scope.locale.code);
    }
  });

}]);
