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

  var environment = require('environment');
  var moment = require('moment');
  var tokenStore = require('tokenStore');
  var resources = require('app/home/language_resources').get();

  var controller = this;

  var MARKETING_BASE_URL = environment.settings.marketing_url;

  tokenStore.getUser().then(init);

  function init (user) {
    var name = user.firstName;
    var isNew = user.signInCount === 1;
    controller.greeting = isNew ? getInitialGreeting(name) : getSubsequentGreeting(name);
    controller.resources = resources;
    controller.selectLanguage = selectLanguage;
    controller.docsUrls = getDocsUrls();
    selectLanguage('JavaScript');
    $scope.context.ready = true;
  }

  function selectLanguage (language) {
    controller.selectedLanguage = language;
  }

  function getInitialGreeting (name) {
    return 'Welcome, ' + name + '.';
  }

  function getSubsequentGreeting (name) {
    return 'Good ' + getTimeOfDay() + ', ' + name + '.';
  }

  function getTimeOfDay () {
    var hour = moment().format('HH');
    if (hour < 12) {
      return 'morning';
    } else if (hour < 17) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }

  function getDocsUrls () {
    return [
      {name: 'Content Delivery API', url: makeDocsUrl('content-delivery-api')},
      {name: 'Images API', url: makeDocsUrl('images-api')},
      {name: 'Content Mangagement API', url: makeDocsUrl('content-management-api')},
      {name: 'Content Preview API', url: makeDocsUrl('content-preview-api')},
      {name: 'Sync API', url: makeDocsUrl('content-delivery-api/#/reference/synchronization')}
    ];

    function makeDocsUrl (path) {
      return MARKETING_BASE_URL + '/developers/docs/references/' + path;
    }
  }
}]);
