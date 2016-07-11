'use strict';

angular.module('cf.app')
.controller('EntityLinkController', ['$scope', function ($scope) {

  var data = $scope.entity || $scope.entityStore.get($scope.link);
  $scope.config = $scope.config || {};

  if (data) {
    getBasicEntityInfo();
    maybeGetEntryDetails();
    maybeGetAssetDetails();
  } else {
    $scope.missing = true;
  }

  function getBasicEntityInfo () {
    get('entityStatus', 'status');
    get('entityTitle', 'title');
  }

  function maybeGetEntryDetails () {
    if (is('Entry') && $scope.config.showDetails) {
      get('entityDescription', 'description');
      get('entryImage', 'image');
    }
  }

  function maybeGetAssetDetails () {
    if (!is('Asset')) {
      return;
    }

    get('assetFile', 'file')
    .then(function (file) {
      if (_.isObject(file) && file.url) {
        get('assetUrl', 'downloadUrl', file.url);
      }
    });
  }

  function get (getter, scopeProperty, arg) {
    return $scope.entityHelpers[getter](arg || data)
    .then(function (value) {
      $scope[scopeProperty] = value;
      return value;
    });
  }

  function is (type) {
    return data.sys.type === type;
  }
}]);
