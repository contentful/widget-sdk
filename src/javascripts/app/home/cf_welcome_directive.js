'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var moment = require('moment');
  var K = require('utils/kefir');
  var tokenStore = require('tokenStore');

  var template = h('section.home-section', [
    h('h2.home-section__heading', ['{{welcome.greeting}}']),
    h('p', {ngIf: 'welcome.user.signInCount === 1'}, [
      'Looks like you\'re new here. Learn more about Contentful from the resources below.'
    ]),
    h('p', {ngIf: 'welcome.user.signInCount > 1'}, [
      'What will you build today?'
    ]),
    h('cf-icon.home__welcome-image', {name: 'home-welcome'})
  ]);

  return {
    template: template,
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      var controller = this;

      // Fetch user and set greeting
      K.onValueScope($scope, tokenStore.user$, function (user) {
        controller.user = user;
        controller.greeting = getGreeting(user);
      });

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
    }],
    controllerAs: 'welcome'
  };
}]);
