import { registerDirective } from 'NgRegistry.es6';
import { h, icons } from 'utils/legacy-html-hyperscript';
import * as K from 'utils/kefir.es6';
import { AUTHOR_ONBOARDING_HELP } from 'featureFlags.es6';

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

registerDirective('cfAuthorsHelp', [
  '$state',
  'utils/LaunchDarkly/index.es6',
  'services/TokenStore.es6',
  'components/authors_help/helpModal.es6',
  'analytics/Analytics.es6',
  'TheStore/index.es6',
  ($state, LD, TokenStore, helpModal, Analytics, { getStore }) => {
    const store = getStore();

    return {
      restrict: 'E',
      scope: {},
      template: h(
        '.authors-help__link-container',
        {
          ngShow: 'help.needHelp'
        },
        [
          h(
            'div.nav-bar__link.authors-help__link',
            {
              ngClick: 'help.openHelp()'
            },
            [h('.authors-help__link-icon', [icons.info]), 'Intro']
          )
        ]
      ),
      controllerAs: 'help',
      controller: [
        '$scope',
        function($scope) {
          const controller = this;

          K.onValueScope($scope, TokenStore.user$, user => {
            const userId = user.sys.id;
            const modalKey = 'ctfl:' + userId + ':author_auto_help_modal';
            const feedbackKey = 'ctfl:' + userId + ':author_help_feedback';

            $scope.name = user.firstName;

            $scope.needFeedback = !store.get(feedbackKey);

            LD.onFeatureFlag($scope, AUTHOR_ONBOARDING_HELP, variation => {
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
                .promise.then(() => {
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
            function showModal() {
              const isNewUser = user.signInCount === 1;
              const wasModalShown = store.get(modalKey);

              if (!wasModalShown && isNewUser) {
                controller.openHelp().then(() => {
                  store.set(modalKey, true);
                });
              }
            }
          });
        }
      ]
    };
  }
]);
