'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var moment = require('moment');
  var K = require('utils/kefir');
  var TokenStore = require('services/TokenStore');
  // Begin test code: test-ps-09-2017-entry-sample-space-cli
  var LD = require('utils/LaunchDarkly');
  var Analytics = require('analytics/Analytics');
  var createSpaceAutomatically = require('components/shared/auto_create_new_space/index').init;
  var getStore = require('TheStore').getStore;
  var store = getStore();

  var flagName = 'test-ps-09-2017-entry-sample-space-cli';
  // End test code: test-ps-09-2017-entry-sample-space-cli

  var contactUsFlagName = 'feature-ps-10-2017-contact-us-space-home';

  var scrollToDeveloperResources = h('span', {}, [
    'Get started with content creation in your space or get ',
    h('a', {ngClick: 'welcome.scrollToDeveloperResources()'}, ['SDKs, tools & tutorials below']),
    '.'
  ]);

  var welcomeTemplate = [
    h('section.home-section', [
      h('h2.home-section__heading', ['{{welcome.greeting}}']),
      h('p', {ngIf: 'welcome.user.signInCount === 1 && !welcome.hasContactUs'}, [
        'Looks like you\'re new here. Learn more about Contentful from the resources below.'
      ]),
      h('p', {ngIf: 'welcome.user.signInCount > 1 && !welcome.hasContactUs'}, [
        'What will you build today?'
      ]),
      scrollToDeveloperResources,
      h('cf-icon.home__welcome-image', {
        name: 'home-welcome',
        ngIf: '!welcome.hasContactUs'
      }),
      h('div', [
        h('cf-contact-us-space-home')
      ])
    ])
  ];

  var template = h('div', [
    h('div', {
      ngIf: '!welcome.onboardNeeded'
    }, welcomeTemplate.concat(h('cf-onboarding-steps'))),
    // Begin test code: test-ps-09-2017-entry-sample-space-cli
    h('div', {
      ngIf: 'welcome.onboardNeeded'
    }, [
      h('div', {
        ngIf: 'welcome.hasContactUs'
      }, welcomeTemplate.concat([
        h('cf-app-entry-onboard', {
          short: 'true'
        })
      ])),
      h('cf-app-entry-onboard', {
        ngIf: '!welcome.hasContactUs'
      })
    ])
    // End test code: test-ps-09-2017-entry-sample-space-cli
  ]);

  return {
    template: template,
    restrict: 'E',
    scope: {},
    controllerAs: 'welcome',
    controller: ['$scope', function ($scope) {
      var controller = this;

      LD.onFeatureFlag($scope, contactUsFlagName, function (flag) {
        controller.hasContactUs = flag;
        $scope.$applyAsync();
      });

      // Begin test code: test-ps-09-2017-entry-sample-space-cli
      // we call handler only once to avoid hiding of the onboarding
      // widget after user will have a space and will be disqualified
      LD.onABTest($scope, flagName, _.once(function (flag) {
        var user = K.getValue(TokenStore.user$);
        var wasAutoSpaceAlreadyCreated = hadSpaceAutoCreated(user);
        var spaceCreatedByTest = hasSpaceCreatedByTest(user);

        if (wasAutoSpaceAlreadyCreated || spaceCreatedByTest) {
          return;
        }

        if (flag !== true) {
          createSpaceAutomatically();
        }

        if (flag !== null) {
          setOnboardNecessityFlag(flag);
        }
      }));
      // End test code: test-ps-09-2017-entry-sample-space-cli

      // Fetch user and set greeting
      K.onValueScope($scope, TokenStore.user$, function (user) {
        controller.user = user;
        controller.greeting = getGreeting(user);
      });

      // Short term solution to encourage new users to immediately access
      // the resources. In the future we would provide a collapsed view
      // of steps to ensure this content is 'above the fold'
      controller.scrollToDeveloperResources = function () {
        $('cf-developer-resources').get(0).scrollIntoView(
          {block: 'start', behavior: 'smooth'}
        );
      };

      function getGreeting (user) {
        if (user) {
          var isNew = user.signInCount === 1;
          var name = user.firstName;

          if (isNew) {
            return 'Welcome, ' + name + '.';
          } else {
            return 'Good ' + getTimeOfDay() + ', ' + name + '.';
          }
        }
      }

      function getTimeOfDay () {
        var hour = moment().hour();
        if (hour < 12) {
          return 'morning';
        } else if (hour < 17) {
          return 'afternoon';
        } else {
          return 'evening';
        }
      }

      // Begin test code: test-ps-09-2017-entry-sample-space-cli
      // we check that there are no spaces for this user
      // and the flag is true
      function setOnboardNecessityFlag (flag) {
        trackExperiment(flag);
        controller.onboardNeeded = flag;
      }

      function trackExperiment (variation) {
        Analytics.track('experiment:start', {
          experiment: {
            id: flagName,
            variation: variation
          }
        });
      }

      function hasSpaceCreatedByTest (user) {
        return store.get('ctfl:' + user.sys.id + ':cliEntrySuccess');
      }

      function hadSpaceAutoCreated (user) {
        return store.get('ctfl:' + user.sys.id + ':spaceAutoCreated');
      }
      // End test code: test-ps-09-2017-entry-sample-space-cli
    }]
  };
}]);
