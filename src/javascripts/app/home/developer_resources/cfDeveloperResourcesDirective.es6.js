import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as resources from 'app/home/developer_resources/DeveloperResources.es6';

registerDirective('cfDeveloperResources', () => ({
  template: JST.cf_developer_resources(),
  restrict: 'E',
  scope: {},
  controller: 'LanguageResourcesController',
  controllerAs: 'resources'
}));

registerController('LanguageResourcesController', [
  'analytics/events/home.es6',
  function(analyticsEvents) {
    const controller = this;

    controller.languages = _.keys(resources.developerResources);
    controller.docsUrls = resources.apiDocsUrls;
    controller.selectLanguage = selectLanguage;
    controller.analytics = analyticsEvents;

    selectLanguage('JavaScript');

    function selectLanguage(language) {
      controller.selected = language;
      controller.languageResources = resources.developerResources[language];
      controller.analytics.selectedLanguage(language);
    }
  }
]);
