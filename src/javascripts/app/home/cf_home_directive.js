'use strict';

angular.module('contentful')

.directive('cfHome', function () {
  return {
    template: JST.cf_home(),
    restrict: 'E',
    scope: {},
    controller: 'HomeController',
    controllerAs: 'home'
  };
})

.controller('HomeController', ['require', function (require) {
  var controller = this;
  var K = require('utils/kefir');
  var moment = require('moment');
  var resources = require('app/home/language_resources');
  var analyticsEvents = require('analytics/events/home');
  var tokenStore = require('tokenStore');
  var CreateSpace = require('services/CreateSpace');
  var accessChecker = require('accessChecker');
  var OrganizationList = require('OrganizationList');

  // Fetch user and set greeting
  K.onValue(tokenStore.user$, function (user) {
    controller.user = user;
    controller.greeting = getGreeting(user);
  });

  K.onValue(tokenStore.spaces$, function (spaces) {
    controller.spaces = spaces;
  });

  K.onValue(tokenStore.spacesByOrganization$, function (spacesByOrg) {
    controller.spacesByOrganization = spacesByOrg;
  });

  controller.canCreateSpace = accessChecker.canCreateSpace;
  controller.resources = resources.languageResources;
  controller.docsUrls = resources.apiDocsUrls;
  controller.selectLanguage = selectLanguage;
  controller.selectedLanguage = 'JavaScript';
  controller.analytics = analyticsEvents;
  controller.showCreateSpaceDialog = CreateSpace.showDialog;
  controller.getOrganizationName = OrganizationList.getName;

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
