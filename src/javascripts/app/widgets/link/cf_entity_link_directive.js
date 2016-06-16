'use strict';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntityLink
 * @description
 * Directive for rendering asset links and entry links/cards.
 */
angular.module('cf.app')
.directive('cfEntityLink', ['cfEntityLink/infoFor', function (infoFor) {

  return {
    restrict: 'E',
    scope: {
      linksApi: '=',
      link: '=',
      showDetails: '=',
      draggable: '='
    },
    template: JST.cf_entity_link(),
    link: function ($scope) {
      $scope.linksApi.resolveLink($scope.link).then(init);

      function init (data) {
        var load = infoFor($scope, data);
        load.basicInfo();
        load.entryDetails(is(data, 'Entry') && $scope.showDetails);
        load.assetDetails(is(data, 'Asset'));
      }

      function is (data, type) {
        return data.sys.type === type;
      }
    }
  };
}])

.factory('cfEntityLink/infoFor', function () {
  return function (scope, data) {
    return {
      basicInfo: basicInfo,
      entryDetails: entryDetails,
      assetDetails: assetDetails
    };

    function basicInfo (shouldLoad) {
      if (shouldLoad !== false) {
        load('entityStatus', 'status');
        load('entityTitle', 'title');
      }
    }

    function entryDetails (shouldLoad) {
      if (shouldLoad !== false) {
        load('entityDescription', 'description');
        load('entryImage', 'image');
      }
    }

    function load (getter, scopeProperty) {
      scope.linksApi[getter](data).then(function (value) {
        scope[scopeProperty] = value;
      });
    }

    function assetDetails () {
      scope.linksApi.assetFile(data).then(function (file) {
        scope.file = file;
        downloadUrl(file);
      });
    }

    function downloadUrl (file) {
      if (_.isObject(file) && file.url) {
        scope.linksApi.assetUrl(file.url).then(function (assetUrl) {
          scope.downloadUrl = assetUrl;
        });
      }
    }
  };
});
