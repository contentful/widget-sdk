'use strict';

angular.module('contentful')
.directive('cfTranslatorLocaleSelector', () => ({
  restrict: 'E',
  template: JST['translator_locale_selector'](),
  controller: 'translatorLocaleSelectorController',
  controllerAs: 'translator',

  scope: {
    policies: '=',
    hasFeatureEnabled: '='
  }
}))
.controller('translatorLocaleSelectorController', ['$scope', 'require', function ($scope, require) {
  var TheLocaleStore = require('TheLocaleStore');
  var ALL_LOCALES = require('PolicyBuilder/CONFIG').ALL_LOCALES;

  var controller = this;

  controller.locales = _.map(TheLocaleStore.getPrivateLocales(), l => ({
    code: l.code,
    name: l.name + ' (' + l.code + ')'
  }));

  controller.locales.unshift({ code: ALL_LOCALES, name: 'All locales' });

  controller.updateLocale = updateLocale;

  controller.localeCode = _.get(getUpdateEntityPolicies()[0], 'locale') || controller.locales[0].code;

  function updateLocale () {
    _.forEach(getUpdateEntityPolicies(), policy => {
      policy.locale = controller.localeCode;
    });
  }

  function getUpdateEntityPolicies () {
    return $scope.policies.entries.allowed
    .concat($scope.policies.assets.allowed)
    .filter(policy => policy.action === 'update');
  }
}]);
