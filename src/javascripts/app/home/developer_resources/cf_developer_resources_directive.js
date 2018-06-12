'use strict';

angular.module('contentful')
.directive('cfDeveloperResources', () => ({
  template: JST.cf_developer_resources(),
  restrict: 'E',
  scope: {},
  controller: 'LanguageResourcesController',
  controllerAs: 'resources'
}))

.controller('LanguageResourcesController', ['require', function (require) {
  var controller = this;
  var resources = require('app/home/developer_resources/DeveloperResources');
  var analyticsEvents = require('analytics/events/home');

  controller.languages = _.keys(resources.developerResources);
  controller.docsUrls = resources.apiDocsUrls;
  controller.selectLanguage = selectLanguage;
  controller.analytics = analyticsEvents;

  selectLanguage('JavaScript');

  function selectLanguage (language) {
    controller.selected = language;
    controller.languageResources = resources.developerResources[language];
    controller.analytics.selectedLanguage(language);
  }
}]);
