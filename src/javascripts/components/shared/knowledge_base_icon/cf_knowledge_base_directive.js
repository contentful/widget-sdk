'use strict';

angular.module('contentful').directive('cfKnowledgeBase', ['$injector', function ($injector) {

  var getUrl    = $injector.get('KnowledgeBase/getUrl');
  var analytics = $injector.get('analytics');

  return {
    restrict: 'E',
    template: JST['cf_knowledge_base'](),
    scope: {
      text: '@',
      tooltipText: '@',
      target: '@'
    },
    link: function (scope, el) {
      scope.url = getUrl(scope.target);
      el.on('click', function () {
        analytics.knowledgeBase(scope.target);
      });
    }
  };
}]);

angular.module('contentful').factory('KnowledgeBase/getUrl', ['$injector', function ($injector) {

  var environment = $injector.get('environment');
  var BASE        = environment.settings.marketing_url.replace(/\/*$/, '/');

  var items = {
    space:            'faq/terminology/#what-is-a-space',
    content_type:     'faq/terminology/#what-is-a-content-type',
    space_creation:   'faq/terminology/#what-is-the-difference-between-a-content-type-and-a-space',
    hibernation:      'developers/docs/', // @todo needs proper article
    entry:            'developers/docs/concepts/data-model/',
    asset:            'developers/docs/concepts/data-model/',
    api_key:          'developers/docs/references/authentication/#the-delivery-api-and-preview-api',
    predefined_value: 'faq/basics/#predefined-values-validation',
    locale:           'developers/docs/concepts/locales/',
    space_template:   'developers/docs/', // @todo needs proper article
    id_change:        'developers/docs/', // @todo needs proper article,
    roles:            'r/knowledgebase/roles-and-permissions/'
  };

  return function getKnowledgeBaseUrl(name) {
    if (items[name]) {
      return BASE + items[name];
    }

    throw new Error('Incorrect Knowledge Base item "' + name + '".');
  };
}]);
