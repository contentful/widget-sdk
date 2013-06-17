'use strict';

angular.module('contentful').controller('ContentTypeListCtrl', function ContentTypeListCtrl($scope) {
  $scope.deleteContentType = function (contentType) {
    contentType.delete(function (err) {
      if (!err) {
        $scope.$apply(function(scope) {
          scope.spaceContext.removeContentType(contentType);
        });
      } else {
        console.log('Error deleting contentType', contentType);
      }
    });
  };

  $scope.numFields = function(contentType) {
    return _.size(contentType.data.fields);
  };

  $scope.reloadContentTypes = function(){
    if (this.spaceContext) this.spaceContext.refreshContentTypes();
  };

  $scope.statusClass = function(contentType) {
    return contentType.data.sys.publishedAt ? 'published' : 'draft';
  };

  $scope.statusLabel = function(contentType) {
    return contentType.data.sys.publishedAt ? 'active' : 'draft';
  };

  $scope.$watch('spaceContext.contentTypes', function(l) {
    $scope.empty = _.isEmpty(l);
  });

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.reloadContentTypes();
  });
});
