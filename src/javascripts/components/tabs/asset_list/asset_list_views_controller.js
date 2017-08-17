'use strict';

angular.module('contentful')
.controller('AssetListViewsController', ['$scope', 'require', 'preserveState', function ($scope, require, preserveState) {
  var $controller = require('$controller');
  var spaceContext = require('spaceContext');

  return $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    viewCollectionName: 'assetListViews',
    generateDefaultViews: spaceContext.uiConfig.resetAssets,
    preserveStateAs: preserveState ? 'assets' : null,
    resetList: function () {
      $scope.searchController.resetAssets(true);
    }
  });

  function getBlankView () {
    return {
      id: null,
      title: 'New View',
      searchTerm: null
    };
  }
}]);
