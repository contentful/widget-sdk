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
      draggable: '=',
      selectable: '='
    },
    template: JST.cf_asset_card(),
    link: function ($scope) {
      var data = $scope.linksApi.getEntity($scope.link);

      if (data) {
        var load = infoFor($scope, data);
        load.basicInfo();
        load.assetDetails();
      } else {
        // @todo entity is missing or inaccessible
      }
    }
  };
}]);
