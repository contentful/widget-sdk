'use strict';

angular.module('contentful').controller('ContentTypeListController', ['$scope', 'require', function ($scope, require) {
  var notification = require('notification');
  var spaceContext = require('spaceContext');
  var accessChecker = require('accessChecker');
  var ctHelpers = require('data/ContentTypes');
  var createViewPersistor = require('data/ListViewPersistor').default;

  var viewPersistor = createViewPersistor(
    spaceContext.getId(), null, 'contentTypes');

  viewPersistor.read().then(loadView);

  $scope.empty = true;

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  $scope.$watchGroup(['context.list', 'context.searchTerm'], function (args) {
    if (args[0] || args[1]) {
      viewPersistor.save({list: args[0], searchTerm: args[1]});
      updateList();
    }
  });

  function loadView (view) {
    $scope.context.list = view.list || 'all';
    $scope.context.searchTerm = view.searchText || '';
  }

  function updateList () {
    $scope.context.isSearching = true;

    // TODO Do not use client instances
    spaceContext.space.getContentTypes({order: 'name', limit: 1000})
      .then(function (contentTypes) {
        // Some legacy content types do not have a name. If it is
        // missing we set it to 'Untitled' so we can display
        // something in the UI. Note that the API requires new
        // Content Types to have a name.
        _.forEach(contentTypes, function (ct) {
          ctHelpers.assureName(ct.data);
        });

        contentTypes.sort(function (a, b) {
          return a.getName().localeCompare(b.getName());
        });

        var sectionVisibility = accessChecker.getSectionVisibility();

        $scope.context.forbidden = !sectionVisibility.contentType;
        $scope.context.ready = true;
        $scope.empty = contentTypes.length === 0;
        $scope.visibleContentTypes = _.filter(contentTypes, shouldBeVisible);
      }, accessChecker.wasForbidden($scope.context))
      .then(function (res) {
        $scope.context.isSearching = false;
        return res;
      })
      .catch(function (err) {
        if (_.isObject(err) && 'statusCode' in err && err.statusCode === -1) {
          $scope.context.isSearching = true;
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
        searchTermRe = new RegExp($scope.context.searchTerm.toLowerCase(), 'gi');
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
    return _.isString($scope.context.searchTerm) && $scope.context.searchTerm.length > 0;
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
      'class': 'entity-status--published',
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
