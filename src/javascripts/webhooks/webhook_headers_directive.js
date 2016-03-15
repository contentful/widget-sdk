'use strict';

angular.module('contentful')

.directive('cfWebhookHeaders', ['$injector', function ($injector) {

  var Command  = $injector.get('command');
  var $timeout = $injector.get('$timeout');

  return {
    restrict: 'E',
    template: JST['webhook_headers'](),
    scope: {headers: '='},
    link: function (scope, el) {
      scope.focusNewName = function () {
        el.find('#webhook-new-header-name').focus();
      };
      scope.focusFirst = function () {
        el.find('input:visible').first().focus();
      };
    },
    controller: ['$scope', function ($scope) {
      $scope.model = {fresh: {}, existing: {}};
      $scope.add = Command.create(add, {disabled: cannotAdd});
      $scope.addWithEnter = addWithEnter;
      $scope.edit = edit;
      $scope.update = update;
      $scope.isEditing = function (name) { return $scope.model.existing.editing === name; };
      $scope.canUpdate = canUpdate;
      $scope.updateWithEnter = updateWithEnter;
      $scope.remove = function (name) { delete $scope.headers[name]; };

      function add() {
        var m = $scope.model.fresh;
        $scope.headers[m.name] = m.value;
        $scope.model.fresh = {};
        $scope.focusNewName();
      }

      function cannotAdd() {
        var m = $scope.model.fresh;
        return !m.name || !m.value || $scope.headers[m.name];
      }

      function addWithEnter($event) {
        if ($event.which === 13 && !cannotAdd()) {
          add();
        }
      }

      function edit(name) {
        var m = $scope.model.existing;
        m.editing = name;
        if (name) {
          m.value = $scope.headers[name];
          $timeout($scope.focusFirst);
        }
      }

      function update() {
        var m = $scope.model.existing;
        if (m.editing) {
          $scope.headers[m.editing] = m.value;
          edit(false);
        }
      }

      function canUpdate() {
        var m = $scope.model.existing;
        return m.editing && m.value;
      }

      function updateWithEnter($event) {
        if ($event.which === 13 && canUpdate()) {
          update();
        } else if ($event.which === 27) {
          edit(false);
        }
      }
    }]
  };
}]);
