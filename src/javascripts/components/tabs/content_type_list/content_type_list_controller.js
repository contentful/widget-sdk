'use strict';

angular.module('contentful')
.controller('ContentTypeListController',
['$scope', '$injector', function ContentTypeListController ($scope, $injector) {
  var notification = $injector.get('notification');
  var spaceContext = $injector.get('spaceContext');
  var FilterQS = $injector.get('FilterQueryString');
  var accessChecker = $injector.get('accessChecker');

  var qs = FilterQS.create('contentTypes');
  var view = qs.readView();
  $scope.context.list = view.list || 'all';
  $scope.searchTerm = view.searchTerm || '';
  $scope.empty = true;

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  $scope.$watchGroup(['context.list', 'searchTerm'], function (args) {
    if (args[0] || args[1]) {
      qs.update({list: args[0], searchTerm: args[1]});
      updateList();
    }
  });

  function updateList () {
    $scope.isSearching = true;

    spaceContext.refreshContentTypes()
      .then(function () {
        var sectionVisibility = accessChecker.getSectionVisibility();

        $scope.context.forbidden = !sectionVisibility.contentType;
        $scope.context.ready = true;
        var contentTypes = spaceContext.contentTypes;
        $scope.empty = contentTypes.length === 0;
        $scope.visibleContentTypes = _.filter(contentTypes, shouldBeVisible);
      }, accessChecker.wasForbidden($scope.context))
      .then(function (res) {
        $scope.isSearching = false;
        return res;
      })
      .catch(function (err) {
        if (_.isObject(err) && 'statusCode' in err && err.statusCode === -1) {
          $scope.isSearching = true;
        }
      });
  }

  function shouldBeVisible (contentType) {
    switch ($scope.context.list) {
      case 'changed':
        return matchesSearchTerm(contentType) && contentType.hasUnpublishedChanges();
      case 'active':
        return matchesSearchTerm(contentType) && contentType.isPublished();
      case 'draft':
        return matchesSearchTerm(contentType) && !contentType.isPublished();
      default:
        return matchesSearchTerm(contentType) && !contentType.isDeleted();
    }
  }

  function matchesSearchTerm (contentType) {
    var searchTermRe;

    try {
      if ($scope.hasQuery()) {
        searchTermRe = new RegExp($scope.searchTerm.toLowerCase(), 'gi');
      }
    } catch (exp) {
      notification.warn('Invalid search term');
    }

    return searchTermRe ? searchTermRe.test(contentType.getName()) : true;
  }

  $scope.numFields = function (contentType) {
    return _.size(contentType.data.fields);
  };

  $scope.hasQuery = function () {
    return _.isString($scope.searchTerm) && $scope.searchTerm.length > 0;
  };

  $scope.statusClass = function (contentType) {
    return getStatus(contentType, 'class');
  };

  $scope.statusLabel = function (contentType) {
    return getStatus(contentType, 'label');
  };

  $scope.hasContentTypes = function () {
    return !$scope.empty || $scope.hasQuery();
  };

  $scope.hasQueryResults = function () {
    return !_.isEmpty($scope.visibleContentTypes);
  };

  function getStatus (contentType, statusType) {
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
}]);
