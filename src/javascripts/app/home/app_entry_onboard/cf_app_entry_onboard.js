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
  var K = require('utils/kefir');
  var TheStore = require('TheStore');
  var TokenStore = require('services/TokenStore');
  var createSampleSpace = require('components/shared/auto_create_new_space/CreateSampleSpace').default;
  var getFirstOwnedOrgWithoutSpaces = require('data/User/index').getFirstOwnedOrgWithoutSpaces;
  var Analytics = require('analytics/Analytics');
  var TEST_NAME = 'test-ps-09-2017-entry-sample-space-cli';
  var template = h('div', [
    h('cf-cli-entry-onboard', {
      short: 'appOnboard.short',
      ngIf: '!appOnboard.chosen',
      setType: 'appOnboard.setType(type)',
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
    scope: {
      short: '<'
    },
    template: template,
    controllerAs: 'appOnboard',
    controller: ['$scope', function ($scope) {
      var controller = this;
      controller.type = null;
      controller.chosen = false;
      controller.short = $scope.short;

      controller.setType = function (type) {
        controller.type = type;
        $scope.$apply();
      };

      controller.choose = function (type) {
        controller.type = type;
        controller.chosen = true;
        if (type === 'webapp') {
          var user = K.getValue(TokenStore.user$);
          var spaces = K.getValue(TokenStore.spacesByOrganization$);
          var org = getFirstOwnedOrgWithoutSpaces(user, spaces);
          createSampleSpace(org, 'blog')
            .then(function () {
              setCliEntrySuccessFlag(user);
            });
        }
        trackSelection(type);
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

      // we track each click (so the user can select, go back and select
      // another option), and later in analysis we will remain only the
      // last click
      function trackSelection (type) {
        Analytics.track('experiment:interaction', {
          experiment: {
            id: TEST_NAME,
            // it is not an A/B test per se, so variation
            // does not make a lot of sense, and we hardcode it
            // we send information about type of chosen way in
            // `interaction_context`
            variation: true,
            interaction_context: type
          }
        });
      }

      function setCliEntrySuccessFlag (user) {
        // we set a flag like we auto-created a space, not just cli entry success
        // the reason for that is because when we trigger auto-space creation,
        // it is not a one-time operation, it actually returns us a stream which
        // will listen until all conditions will be satisfied
        // and in order to avoid code changing, we just pretend space was auto created
        TheStore.set('ctfl:' + user.sys.id + ':spaceAutoCreated', true);
      }
    }]
  };
}]);
