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
      draggable: '=',
      selectable: '='
    },
    template: JST.cf_entity_link(),
    link: function ($scope) {
      var data = $scope.linksApi.getEntity($scope.link);

      if (data) {
        var load = infoFor($scope, data);
        load.basicInfo();
        load.entryDetails(is('Entry') && !!$scope.showDetails);
        load.assetDetails(is('Asset'));
      } else {
        // @todo entity is missing or inaccessible
      }

      function is (type) {
        return data.sys.type === type;
      }
    }
  };
}])

.factory('cfEntityLink/infoFor', ['$injector', function ($injector) {

  var $q = $injector.get('$q');

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
      maybeCall(getter, data).then(function (value) {
        scope[scopeProperty] = value;
      });
    }

    function assetDetails () {
      maybeCall('assetFile', data).then(function (file) {
        scope.file = file;
        downloadUrl(file);
      });
    }

    function downloadUrl (file) {
      if (_.isObject(file) && file.url) {
        maybeCall('assetUrl', file.url).then(function (assetUrl) {
          scope.downloadUrl = assetUrl;
        });
      }
    }

    function maybeCall (getter, arg) {
      if (scope.linksApi[getter]) {
        return scope.linksApi[getter](arg);
      } else {
        return $q.reject();
      }
    }
  };
}]);
