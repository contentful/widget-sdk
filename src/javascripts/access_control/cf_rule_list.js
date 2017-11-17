'use strict';

angular.module('contentful').directive('cfRuleList', ['require', function (require) {

  var spaceContext            = require('spaceContext');
  var TheLocaleStore          = require('TheLocaleStore');
  var getDefaultRuleGetterFor = require('PolicyBuilder/defaultRule').getDefaultRuleGetterFor;
  var ALL_LOCALES             = require('PolicyBuilder/CONFIG').ALL_LOCALES;

  return {
    restrict: 'E',
    template: JST['rule_list'](),
    scope: {
      rules: '=',
      entity: '@',
      isDisabled: '='
    },
    controller: ['$scope', function ($scope) {
      $scope.spaceContext = spaceContext;
      $scope.remove = remove;
      $scope.entityName = getEntityName($scope.entity);
      $scope.getDefaultRule = getDefaultRuleGetterFor($scope.entity);

      $scope.locales = _.map(TheLocaleStore.getPrivateLocales(), function (l) {
        return { code: l.code, name: l.name + ' (' + l.code + ')' };
      });
      $scope.locales.unshift({ code: ALL_LOCALES, name: 'All locales' });

      $scope.$watch(function () {
        return _.get($scope, 'rules.allowed', []).length;
      }, function (current, previous) {
        if (current === 0 && previous > 0) {
          $scope.rules.denied = [];
        }
      });

      function remove(rule) {
        var index = -1;
        var collection = null;
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
