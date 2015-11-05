'use strict';

angular.module('contentful').directive('cfRuleList', ['$injector', function ($injector) {

  var random         = $injector.get('random');
  var spaceContext   = $injector.get('spaceContext');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var DEFAULT_RULE = {
    action: 'read',
    scope: 'any',
    locale: null
  };

  var DEFAULT_ENTRY_RULE = {
    contentType: 'all',
    field: null
  };

  return {
    restrict: 'E',
    template: JST['rule_list'](),
    scope: {
      rules: '=',
      entity: '@'
    },
    controller: ['$scope', function ($scope) {
      $scope.spaceContext = spaceContext;
      $scope.locales = TheLocaleStore.getPrivateLocales();
      $scope.entityName = getEntityName($scope.entity);
      $scope.getDefaultRule = getDefaultRuleFor($scope.entity);

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

  function getDefaultRuleFor(entity) {
    return function () {
      var meta = { id: random.id(), entity: entity };
      var base = _.extend(meta, DEFAULT_RULE);

      if (entity === 'entry') {
        return _.extend(base, DEFAULT_ENTRY_RULE);
      } else {
        return base;
      }
    };
  }

  function getEntityName(entity) {
    if (entity === 'entry') {
      return ['entry', 'Entries'];
    } else {
      return ['asset', 'Assets'];
    }
  }
}]);
