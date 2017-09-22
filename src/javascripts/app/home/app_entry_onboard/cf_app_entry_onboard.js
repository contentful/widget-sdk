/**
 * @ngdoc directive
 * @module contentful
 * @name cfAppEntryOnboard
 *
 * @description
 * Directive to help user set up his example space
 * Via CLI or using our web app
 * It is used in the beginning, when user has no
 * spaces at all.
 *
 */

'use strict';

angular.module('contentful')
.directive('cfAppEntryOnboard', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var template = h('div', [
    h('cf-cli-entry-onboard', {
      ngIf: '!appOnboard.chosen',
      type: 'appOnboard.type',
      choose: 'appOnboard.choose(type)'
    }),
    h('cf-cli-description-onboard', {
      ngIf: 'appOnboard.isCLIChosen()',
      back: 'appOnboard.back()'
    }),
    h('div', {
      ngIf: 'appOnboard.isWebAppChosen()'
    })
  ]);
  return {
    restrict: 'E',
    scope: {},
    template: template,
    controllerAs: 'appOnboard',
    controller: ['$scope', function ($scope) {
      var controller = this;
      controller.type = null;
      controller.chosen = false;

      controller.choose = function (type) {
        controller.type = type;
        controller.chosen = true;
        $scope.$apply();
      };

      controller.back = function () {
        controller.chosen = false;
        $scope.$apply();
      };

      controller.isCLIChosen = isTypeChosen.bind(null, 'cli');
      controller.isWebAppChosen = isTypeChosen.bind(null, 'webapp');

      function isTypeChosen (type) {
        return controller.chosen === true && controller.type === type;
      }
    }]
  };
}]);
