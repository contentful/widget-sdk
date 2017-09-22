'use strict';

angular.module('contentful')
.directive('cfCliEntryOnboard', ['require', function (require) {
  var K = require('utils/kefir');
  var tokenStore = require('services/TokenStore');
  var renderTemplate = require('app/home/app_entry_onboard/cli_entry_onboard/template').render;
  var moment = require('moment');
  return {
    restrict: 'E',
    scope: {
      type: '=',
      choose: '&'
    },
    template: '<cf-component-bridge component="myComponent">',
    controller: ['$scope', function ($scope) {
      $scope.selectType = function (type) {
        $scope.type = type;
        renderWithApply();
      };

      K.onValueScope($scope, tokenStore.user$, function (user) {
        $scope.user = user;
        $scope.greeting = getGreeting(user);
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

      $scope.continue = function (type) {
        $scope.choose({ type: type });
      };

      function render () {
        $scope.myComponent = renderTemplate($scope);
      }

      // we need this function to react to event handlers from Preact
      // because angular does not track them internally
      function renderWithApply () {
        render();
        $scope.$apply();
      }

      render();
    }]
  };
}]);
