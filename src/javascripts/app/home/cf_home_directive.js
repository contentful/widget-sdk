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

.controller('HomeController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var K = require('utils/kefir');
  var moment = require('moment');
  var resources = require('app/home/language_resources');
  var analyticsEvents = require('analytics/events/home');
  var tokenStore = require('tokenStore');
  var CreateSpace = require('services/CreateSpace');
  var accessChecker = require('accessChecker');
  var OrganizationList = require('OrganizationList');

  var createSpaceDialog;

  // Fetch user and set greeting
  K.onValueScope($scope, tokenStore.user$, function (user) {
    controller.user = user;
    controller.greeting = getGreeting(user);
  });

  K.onValueScope($scope, tokenStore.spaces$, function (spaces) {
    controller.spaces = spaces;
  });

  K.onValueScope($scope, tokenStore.spacesByOrganization$, function (spacesByOrg) {
    controller.spacesByOrganization = spacesByOrg;
  });

  // open the create space dialog if there are no spaces and user has access
  var promptCreateSpace$ = K.combineProperties([tokenStore.spaces$, accessChecker.canCreateSpace$], function (spaces, canCreate) {
    return _.isEqual(spaces, []) && canCreate;
  });

  K.onValueScope($scope, promptCreateSpace$, function (shouldOpen) {
    if (shouldOpen && !createSpaceDialog) {
      createSpaceDialog = CreateSpace.showDialog();
    }
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
