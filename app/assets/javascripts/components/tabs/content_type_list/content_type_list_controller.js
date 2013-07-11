'use strict';

angular.module('contentful').controller('ContentTypeListCtrl', function ContentTypeListCtrl($scope) {
  $scope.numFields = function(contentType) {
    return _.size(contentType.data.fields);
  };

  // TODO should go into the spacecontextcontroller as soon as we have one
  $scope.reloadContentTypes = function(){
    if (this.spaceContext) this.spaceContext.refreshContentTypes();
  };

  $scope.statusClass = function(contentType) {
    if (contentType.data.sys.publishedAt) {
      if (contentType.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else {
      return 'draft';
    }
  };

  $scope.statusLabel = function(contentType) {
    if (contentType.data.sys.publishedAt) {
      if (contentType.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'active';
      }
    } else {
      return 'draft';
    }
  };

  $scope.$watch(function (scope) {
    if (scope.spaceContext.contentTypes) {
      return scope.spaceContext.contentTypes.length;
    } else {
      return 0;
    }
  }, function (length) {
    $scope.empty = length === 0;
  });

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.reloadContentTypes();
  });
});
