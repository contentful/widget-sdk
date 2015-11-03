'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var Command  = $injector.get('command');
  var space    = $injector.get('spaceContext').space;
  var roleRepo = $injector.get('RoleRepository').getInstance(space);

  $scope.internal = {
    entries: { allowed: [], denied: [] },
    assets: { allowed: [], denied: [] },
    contentTypes: {},
    apiKeys: {},
    spaceSettings: {}
  };

  $scope.$watch('role.name', function (name) {
    $scope.context.title = name ? name : 'Untitled';
  });

  $scope.$watch('roleForm.$dirty', function (isDirty) {
    $scope.context.dirty = isDirty || $scope.context.isNew;
  });

  $scope.save = Command.create(function () {
    var method = $scope.context.isNew ? 'create' : 'save';
    return roleRepo[method]($scope.role).then(handleRole);
  });

  function handleRole(role) {
    $scope.role = role;
    $scope.roleForm.$setPristine();
    $scope.context.dirty = false;
    $scope.context.isNew = false;
  }
}]);

angular.module('contentful').directive('cfRuleList', ['$injector', function ($injector) {

  var random         = $injector.get('random');
  var spaceContext   = $injector.get('spaceContext');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var DEFAULT_ROLE = {
    action: 'read',
    scope: 'any',
    contentType: 'all',
    field: null,
    locale: null
  };

  return {
    restrict: 'E',
    template: JST['rule_list'](),
    scope: { rules: '=', entity: '@' },
    controller: ['$scope', function ($scope) {
      $scope.spaceContext = spaceContext;
      $scope.locales = TheLocaleStore.getPrivateLocales();
      $scope.entityName = getEntityName($scope.entity);
      $scope.getDefaultRule = getDefaultRule;

      $scope.remove = function (rule) {
        var index = $scope.rules.allowed.indexOf(rule);
        var collection = 'allowed';

        if (index < 0) {
          index = $scope.rules.denied.indexOf(rule);
          collection = 'denied';
        }

        if (index > -1) {
          $scope.rules[collection].splice(index, 1);
        }
      };
    }]
  };

  function getDefaultRule() {
    return _.extend({ id: random.id() }, DEFAULT_ROLE);
  }

  function getEntityName(entity) {
    return (entity === 'entry') ? ['entry', 'Entries'] : ['asset', 'Assets'];
  }
}]);

angular.module('contentful').directive('cfRule', [function () {
  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', function ($scope) {
      $scope.$watch('rule.action', function (action) {
        $scope.rule.field = $scope.rule.locale = (action === 'edit') ? 'all' : null;
      });

      $scope.$watch('rule.contentType', function (id) {
        var ct = $scope.spaceContext._publishedContentTypesHash[id];
        $scope.contentTypeFields = dotty.get(ct, 'data.fields', []);
        $scope.rule.field = 'all';
      });
    }]
  };
}]);
