'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var moment = require('moment');
  var K = require('utils/kefir');
  var tokenStore = require('services/TokenStore');
  // Begin test code: test-ps-09-2017-entry-sample-space-cli
  var LD = require('utils/LaunchDarkly');

  var flagName = 'test-ps-09-2017-entry-sample-space-cli';
  // End test code: test-ps-09-2017-entry-sample-space-cli

  var scrollToDeveloperResources = h('span', {}, [
    'Get started with content creation in your space or get ',
    h('a', {ngClick: 'welcome.scrollToDeveloperResources()'}, ['SDKs, tools & tutorials below']),
    '.'
  ]);

  var template = h('div', [
    h('div', {
      ngIf: '!welcome.onboardNeeded'
    }, [
      h('section.home-section', [
        h('h2.home-section__heading', ['{{welcome.greeting}}']),
        h('p', {ngIf: 'welcome.user.signInCount === 1'}, [
          'Looks like you\'re new here. Learn more about Contentful from the resources below.'
        ]),
        h('p', {ngIf: 'welcome.user.signInCount > 1'}, [
          'What will you build today?'
        ]),
        scrollToDeveloperResources,
        h('cf-icon.home__welcome-image', {name: 'home-welcome'})
      ]),
      h('cf-onboarding-steps')
    ]),
    // Begin test code: test-ps-09-2017-entry-sample-space-cli
    h('cf-app-entry-onboard', {
      ngIf: 'welcome.onboardNeeded'
    })
    // End test code: test-ps-09-2017-entry-sample-space-cli
  ]);

  return {
    template: template,
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      var controller = this;

      // Begin test code: test-ps-09-2017-entry-sample-space-cli
      const cliEntryOnboardingTest$ = LD.getFeatureFlag(flagName);
      K.onValueScope($scope, cliEntryOnboardingTest$, setOnboardNecessityFlag);
      // End test code: test-ps-09-2017-entry-sample-space-cli

      // Fetch user and set greeting
      K.onValueScope($scope, tokenStore.user$, function (user) {
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
        if (flag) {
          tokenStore.getSpaces().then(function (spaces) {
            controller.onboardNeeded = spaces && spaces.length === 0;
          });
        } else {
          controller.onboardNeeded = false;
        }
        // End test code: test-ps-09-2017-entry-sample-space-cli
      }
    }],
    controllerAs: 'welcome'
  };
}]);
