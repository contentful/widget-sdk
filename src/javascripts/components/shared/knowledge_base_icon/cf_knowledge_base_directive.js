'use strict';

// TODO: should use transclusion
// e.g. <cf-knowledge-base target="roles">text to be displayed</cf-knowlege-base>

angular.module('contentful').directive('cfKnowledgeBase', ['$injector', function ($injector) {

  var getUrl = $injector.get('KnowledgeBase/getUrl');
  var trackFollowedKbpLink = $injector.get('analyticsEvents').trackFollowedKbpLink;

  return {
    restrict: 'E',
    template: JST['cf_knowledge_base'](),
    scope: {
      text: '@',
      tooltipText: '@',
      target: '@',
      inlineText: '@'
    },
    link: function (scope, el) {
      scope.url = getUrl(scope.target);
      el.on('click', function () {
        trackFollowedKbpLink(scope.target);
      });
    }
  };
}]);

angular.module('contentful').factory('KnowledgeBase/getUrl', ['$injector', function ($injector) {

  var environment = $injector.get('environment');
  var BASE = environment.settings.marketing_url.replace(/\/*$/, '/');

  var items = {
    space: 'faq/terminology/#what-is-a-space',
    content_type: 'faq/terminology/#what-is-a-content-type',
    space_creation: 'faq/terminology/#what-is-the-difference-between-a-content-type-and-a-space',
    hibernation: 'developers/docs/', // @todo needs proper article
    entry: 'developers/docs/concepts/data-model/',
    asset: 'developers/docs/concepts/data-model/',
    api_key: 'developers/docs/references/authentication/#the-delivery-api-and-preview-api',
    predefined_value: 'faq/basics/#how-can-i-use-predefined-values',
    locale: 'developers/docs/concepts/locales/',
    space_template: 'developers/docs/', // @todo needs proper article
    id_change: 'developers/docs/', // @todo needs proper article,
    roles: 'r/knowledgebase/roles-and-permissions/',
    field_lifecycle: 'faq/basics/#what-is-the-lifecycle-of-a-field',
    content_apis: 'developers/docs/concepts/apis/',
    delivery_api: 'developers/docs/references/content-delivery-api',
    management_api: 'developers/docs/references/content-management-api',
    cma_key: 'developers/docs/references/authentication/#the-management-api',
    content_preview: 'r/knowledgebase/setup-content-preview/'
  };

  return function getKnowledgeBaseUrl (name) {
    if (items[name]) {
      return BASE + items[name];
    }

    throw new Error('Incorrect Knowledge Base item "' + name + '".');
  };
}]);
