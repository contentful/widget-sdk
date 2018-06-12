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
.directive('cfAuthorsHelp', ['require', require => {
  var h = require('utils/hyperscript').h;
  var helpModal = require('components/authors_help/helpModal');
  var LD = require('utils/LaunchDarkly');
  var K = require('utils/kefir');
  var TokenStore = require('services/TokenStore');
  var getStore = require('TheStore').getStore;
  var store = getStore();
  var $state = require('$state');
  var Analytics = require('analytics/Analytics');
  var infoIcon = require('svg/icon-info').default;

  var authorHelpFlag = 'feature-ps-12-2017-author-onboarding-help';

  return {
    restrict: 'E',
    scope: {},
    template: h('.authors-help__link-container', {
      ngShow: 'help.needHelp'
    }, [
      h('div.nav-bar__link.authors-help__link', {
        ngClick: 'help.openHelp()'
      }, [
        h('.authors-help__link-icon', [infoIcon]),
        'Intro'
      ])
    ]),
    controllerAs: 'help',
    controller: ['$scope', function ($scope) {
      var controller = this;

      K.onValueScope($scope, TokenStore.user$, user => {
        const userId = user.sys.id;
        var modalKey = 'ctfl:' + userId + ':author_auto_help_modal';
        var feedbackKey = 'ctfl:' + userId + ':author_help_feedback';

        $scope.name = user.firstName;

        $scope.needFeedback = !store.get(feedbackKey);

        LD.onFeatureFlag($scope, authorHelpFlag, variation => {
          controller.needHelp = variation;

          // if the user has help, we'll try to show him it
          // automatically for the first time
          if (variation) {
            showModal();
          }
        });

        controller.openHelp = () => {
          Analytics.track('element:click', {
            elementId: 'modal_help_open',
            groupId: 'editors_authors_help',
            fromState: $state.current.name
          });

          return helpModal
            .openHelp($scope)
            .promise
            .then(() => {
              $scope.feedback = undefined;
            })
            .catch(() => {
              $scope.feedback = undefined;
            });
        };

        $scope.chooseFeedback = type => {
          Analytics.track('element:click', {
            elementId: 'modal_feedback_' + type,
            groupId: 'editors_authors_help_feedback',
            fromState: $state.current.name
          });
          $scope.feedback = type;
          $scope.needFeedback = false;
          store.set(feedbackKey, true);
        };

        $scope.openLink = type => {
          Analytics.track('element:click', {
            elementId: 'modal_link_' + type,
            groupId: 'editors_authors_help',
            fromState: $state.current.name
          });
        };

        // we automatically open the modal for users who logged in
        // for the first time and have not seen it yet
        function showModal () {
          var isNewUser = user.signInCount === 1;
          var wasModalShown = store.get(modalKey);

          if (!wasModalShown && isNewUser) {
            controller.openHelp().then(() => {
              store.set(modalKey, true);
            });
          }
        }
      });
    }]
  };
}]);
