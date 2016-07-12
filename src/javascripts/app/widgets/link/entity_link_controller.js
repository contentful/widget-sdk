'use strict';

angular.module('cf.app')
.controller('EntityLinkController', ['$scope', function ($scope) {

  var data = $scope.entity;
  $scope.config = $scope.config || {};

  if (!data) {
    var getEntity = dotty.get($scope, 'entityStore.get', _.noop);
    data = getEntity($scope.link);
  }

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
    if (is('Asset')) {
      get('assetFile', 'file')
      .then(_.partial(get, 'assetFileUrl', 'downloadUrl'));
    }
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
