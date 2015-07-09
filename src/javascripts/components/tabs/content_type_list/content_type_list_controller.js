'use strict';

angular.module('contentful').controller('ContentTypeListController', ['$scope', 'notification', function ContentTypeListController($scope, notification) {
  $scope.contentTypeSection = 'all';

  $scope.numFields = function(contentType) {
    return _.size(contentType.data.fields);
  };

  $scope.$watch(function (scope) {
    if (scope.spaceContext.contentTypes) {
      return scope.spaceContext.contentTypes;
    } else {
      return [];
    }
  }, function (contentTypes) {
    $scope.contentTypes = $scope.spaceContext.filterAndSortContentTypes(contentTypes);
    $scope.empty = contentTypes.length === 0;
  });

  $scope.$watch('searchTerm',  function (term) {
    if (term === null) return;
    $scope.context.list = 'all';
    $scope.resetContentTypes();
  });

  $scope.switchList = function(list){
    $scope.searchTerm = null;
    var shouldReset = $scope.context.list == list;

    if (shouldReset) {
      this.resetContentTypes();
    } else {
      $scope.context.list = list;
    }
  };

  $scope.visibleInCurrentList = function(contentType){
    if($scope.searchTerm){
      var searchTermRe;
      try {
        searchTermRe = new RegExp($scope.searchTerm.toLowerCase(), 'gi');
      } catch(exp) {
        notification.warn('Invalid search term');
      }
      return searchTermRe.test(contentType.getName());
    }
    switch ($scope.context.list) {
      case 'all':
        return !contentType.isDeleted();
      case 'changed':
        return contentType.hasUnpublishedChanges();
      case 'active':
        return contentType.isPublished();
      case 'draft':
        return !contentType.isPublished();
      default:
        return true;
    }
  };

  $scope.resetContentTypes = function(){
    if (this.spaceContext) this.spaceContext.refreshContentTypes();
  };

  $scope.hasQuery = function () {
    var noQuery = $scope.context.list == 'all' && _.isEmpty($scope.searchTerm);
    return !noQuery;
  };

  function getStatus(contentType, statusType) {
    var status = {
      'class': 'published',
      label: 'active'
    };
    if (contentType.getPublishedAt()) {
      if (contentType.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return status[statusType];
      }
    } else {
      return 'draft';
    }
  }

  $scope.statusClass = function(contentType) {
    return getStatus(contentType, 'class');
  };

  $scope.statusLabel = function(contentType) {
    return getStatus(contentType, 'label');
  };

}]);
