'use strict';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfAssetCard
 * @description
 * Directive rendering an asset card.
 *
 * @property {Asset} entity Asset whose info will be shown in the card.
 * @property {string} locale Determines language of title and media.
 * @property {boolean} asThumb
 */
angular.module('cf.app')
.directive('cfAssetCard', ['$controller',
function ($controller) {

  return {
    restrict: 'E',
    scope: {
      entityInfo: '=',
      locale: '@',
      asThumb: '='
    },
    transclude: true,
    template: JST.cf_asset_card(),
    link: link
  };

  function link ($scope) {
    // TODO: Consider "isMissing", e.g. no rights.
    var locale = $scope.locale;
    var entityInfo = $scope.entityInfo;
    var asset = entityInfo && entityInfo.getEntity();
    var title = entityInfo && entityInfo.getTitle(locale);
    var file = dotty.get(asset, 'data.fields.file.' + locale);

    $scope.entity = asset;
    $scope.title = title;
    $scope.file = file;

    $scope.openEntity = function () {
      // widgetApi.state.goToEntity(asset, {addToContext: true});
    };
    $scope.entityStatusController =
      $controller('EntityStatusController', {$scope: $scope});
  }
}]);
