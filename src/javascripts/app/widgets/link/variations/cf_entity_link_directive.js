'use strict';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntityLink
 * @description
 * Directive for rendering an
 * - Asset link
 * - Entry link
 * - Entry card
 * NOTE: All of the above are similar in appearance. Should their appearance
 *       diverge in the future or this directive get too complex, then it should
 *       be considered to split this into separate directives.
 *
 * @property {Entry|Asset} entity Entity whose info will be shown in the link/card.
 *           TODO: Widget-API needs to be changed to return a plain object and
 *                 that'll be all we'll be able to work with in here.
 * @property {locale} Determines language of title, description and image.
 * @property {boolean} showDetails If true, an Entry's title and description will
 *           be displayed if available (basically an entry “Card”)
 */
angular.module('cf.app')
.directive('cfEntityLink', ['$controller',
function ($controller) {

  return {
    restrict: 'E',
    scope: {
      entity: '=',
      locale: '@',
      showDetails: '='
    },
    transclude: true,
    template: JST.cf_entity_link(),
    // TODO: Kill dependency, inject some sort of widgetApi.newEntityContext instead
    require: '^cfWidgetApi',
    link: link
  };

  function link ($scope, $elem, $attrs, widgetApi) {
    var entity = $scope.entity;
    var locale = $scope.locale;

    // TODO: Nicen "isMissing" (e.g. no rights) case.
    $scope.title = widgetApi.space.getEntityTitle(entity, locale);
    if ($scope.showDetails) {
      $scope.description = widgetApi.space.getEntityDescription(entity);
      $scope.imageFile = widgetApi.space.getEntryImage(entity);
    }

    $scope.entityStatusController =
      $controller('EntityStatusController', {$scope: $scope});

    $scope.openEntity = function () {
      widgetApi.state.goToEntity(entity, {addToContext: true});
    };
  }

}]);
