'use strict';

angular.module('contentful').directive('cfRuleList', ['$injector', function ($injector) {

  var spaceContext            = $injector.get('spaceContext');
  var TheLocaleStore          = $injector.get('TheLocaleStore');
  var getDefaultRuleGetterFor = $injector.get('PolicyBuilder/defaultRule').getDefaultRuleGetterFor;

  return {
    restrict: 'E',
    template: JST['rule_list'](),
    scope: {
      rules: '=',
      entity: '@'
    },
    controller: ['$scope', function ($scope) {
      $scope.spaceContext = spaceContext;

      $scope.locales = _.map(TheLocaleStore.getPrivateLocales(), function (l) {
        return { code: l.internal_code, name: l.name + ' (' + l.code + ')' };
      });
      $scope.locales.unshift({ code: 'all', name: 'All languages' });

      $scope.entityName = getEntityName($scope.entity);
      $scope.getDefaultRule = getDefaultRuleGetterFor($scope.entity);

      $scope.remove = function (rule) {
        var index = -1;
        var collection = null;
        find('allowed');

        if (index < 0) { find('denied'); }
        if (index > -1 && collection) { collection.splice(index, 1); }

        function find(collectionName) {
          index = $scope.rules[collectionName].indexOf(rule);
          collection = $scope.rules[collectionName];
        }
      };
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
