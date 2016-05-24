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
      entity: '=',
      locale: '@',
      asThumb: '='
    },
    transclude: true,
    template: JST.cf_asset_card(),
    // TODO: Kill dependency, inject some sort of widgetApi.newEntityContext instead
    require: '^cfWidgetApi',
    link: link
  };

  function link ($scope, $elem, $attrs, widgetApi) {
    // TODO: Consider "isMissing", e.g. no rights.
    var asset = $scope.entity;
    var locale = $scope.locale;
    var title = widgetApi.space.getEntityTitle(asset);
    var file = dotty.get(asset, 'data.fields.file.' + locale);

    $scope.title = title;
    $scope.file = file;

    $scope.openEntity = function () {
      widgetApi.state.goToEntity(asset, {addToContext: true});
    };
    $scope.entityStatusController =
      $controller('EntityStatusController', {$scope: $scope});
  }
}]);
