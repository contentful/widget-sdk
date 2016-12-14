'use strict';

angular.module('contentful')

.directive('cfHome', function () {
  return {
    template: JST.cf_home(),
    restrict: 'E',
    scope: true,
    controller: 'HomeController',
    controllerAs: 'home'
  };
})

.controller('HomeController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var moment = require('moment');
  var resources = require('app/home/language_resources');
  var homeAnalytics = require('analyticsEvents/home');

  controller.getGreeting = _.memoize(getGreeting);

  // TODO not a good solution
  // Returns the distance from the top of the page
  // i.e. height of the nav bar + persistent notification if it is being shown
  controller.getDistanceFromTop = function () {
    return $scope.persistentNotification ? 108 : 63;
  };

  controller.resources = resources.languageResources;
  controller.docsUrls = resources.apiDocsUrls;
  controller.selectLanguage = selectLanguage;
  controller.selectedLanguage = 'JavaScript';
  controller.analytics = homeAnalytics;

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

  function selectLanguage (language) {
    controller.selectedLanguage = language;
    controller.analytics.selectedLanguage(language);
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
}]);
