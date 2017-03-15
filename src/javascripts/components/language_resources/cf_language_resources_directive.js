'use strict';

angular.module('contentful')
.directive('cfLanguageResources', function () {
  return {
    template: JST.cf_language_resources(),
    restrict: 'E',
    scope: {},
    controller: 'LanguageResourcesController',
    controllerAs: 'languageResources'
  };
})

.controller('LanguageResourcesController', ['require', function (require) {
  var controller = this;
  var resources = require('app/home/language_resources');
  var analyticsEvents = require('analytics/events/home');

  controller.resources = resources.languageResources;
  controller.docsUrls = resources.apiDocsUrls;
  controller.selectLanguage = selectLanguage;
  controller.selectedLanguage = 'JavaScript';
  controller.analytics = analyticsEvents;

  function selectLanguage (language) {
    controller.selectedLanguage = language;
    controller.analytics.selectedLanguage(language);
  }

}]);
