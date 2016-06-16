'use strict';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfAssetCard
 * @description
 * Directive rendering an asset card.
 */
angular.module('cf.app')
.directive('cfAssetCard', ['cfEntityLink/infoFor', function (infoFor) {

  return {
    restrict: 'E',
    scope: {
      linksApi: '=',
      link: '=',
      asThumb: '=',
      draggable: '='
    },
    template: JST.cf_asset_card(),
    link: function ($scope) {
      $scope.linksApi.resolveLink($scope.link).then(init);

      function init (data) {
        var load = infoFor($scope, data);
        load.basicInfo();
        load.assetDetails();
      }
    }
  };
}]);
