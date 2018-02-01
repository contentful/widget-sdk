'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var moment = require('moment');
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var TokenStore = require('services/TokenStore');

  var contactUsFlagName = 'feature-ps-10-2017-contact-us-space-home';

  var scrollToDeveloperResources = h('span', {}, [
    'Get started with content creation in your space or get ',
    h('a', {ngClick: 'welcome.scrollToDeveloperResources()'}, ['SDKs, tools & tutorials below']),
    '.'
  ]);

  var template = h('section.home-section', [
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
    }]
  };
}]);
