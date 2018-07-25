'use strict';

angular.module('contentful').directive('cfRuleList', ['require', require => {

  const spaceContext            = require('spaceContext');
  const TheLocaleStore          = require('TheLocaleStore');
  const getDefaultRuleGetterFor = require('PolicyBuilder/defaultRule').getDefaultRuleGetterFor;
  const ALL_LOCALES             = require('PolicyBuilder/CONFIG').ALL_LOCALES;

  return {
    restrict: 'E',
    template: JST['rule_list'](),
    scope: {
      rules: '=',
      entity: '@',
      isDisabled: '='
    },
    controller: ['$scope', $scope => {
      $scope.spaceContext = spaceContext;
      $scope.remove = remove;
      $scope.entityName = getEntityName($scope.entity);
      $scope.getDefaultRule = getDefaultRuleGetterFor($scope.entity);

      $scope.locales = _.map(TheLocaleStore.getPrivateLocales(), l => ({
        code: l.code,
        name: l.name + ' (' + l.code + ')'
      }));
      $scope.locales.unshift({ code: ALL_LOCALES, name: 'All locales' });

      $scope.$watch(() => _.get($scope, 'rules.allowed', []).length, (current, previous) => {
        if (current === 0 && previous > 0) {
          $scope.rules.denied = [];
        }
      });

      function remove(rule) {
        let index = -1;
        let collection = null;
        find('allowed');

        if (index < 0) { find('denied'); }
        if (index > -1 && collection) { collection.splice(index, 1); }

        function find(collectionName) {
          index = $scope.rules[collectionName].indexOf(rule);
          collection = $scope.rules[collectionName];
        }
      }
    }]
  };

  function getEntityName(entity) {
    if (entity === 'entry') {
      return ['entry', 'Entries'];
    } else {
      return ['asset', 'Assets'];
    }
  }
}]);
