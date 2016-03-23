'use strict';

angular.module('contentful')

.directive('cfWebhookHeaders', ['$injector', function ($injector) {

  var Command  = $injector.get('command');
  var $timeout = $injector.get('$timeout');

  return {
    restrict: 'E',
    template: JST['webhook_headers'](),
    scope: {headers: '=', isDirty: '='},
    link: function (scope, el) {
      scope.focusNewKey = function () {
        el.find('#webhook-new-header-key').focus();
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
      $scope.isEditing = isEditing;
      $scope.canUpdate = canUpdate;
      $scope.updateWithEnter = updateWithEnter;
      $scope.remove = remove;

      $scope.$watch('model.fresh', function (m) {
        $scope.isDirty =
          (_.isString(m.key) && m.key.length > 0) ||
          (_.isString(m.value) && m.value.length > 0);
      }, true);

      function add() {
        var m = $scope.model.fresh;
        $scope.headers.push({key: m.key, value: m.value});
        $scope.model.fresh = {};
        $scope.focusNewKey();
      }

      function cannotAdd() {
        var m = $scope.model.fresh;
        return !m.key || !m.value || _.find($scope.headers, {key: m.key});
      }

      function addWithEnter($event) {
        if ($event.which === 13 && !cannotAdd()) {
          add();
        }
      }

      function edit(header) {
        var m = $scope.model.existing;
        m.editing = header;
        if (header) {
          m.value = header.value;
          $timeout($scope.focusFirst);
        }
      }

      function isEditing(header) {
        return $scope.model.existing.editing === header;
      }

      function update() {
        var m = $scope.model.existing;
        if (m.editing) {
          m.editing.value = m.value;
          edit(null);
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
          edit(null);
        }
      }

      function remove(header) {
        var index = $scope.headers.indexOf(header);
        if (index > -1) {
          $scope.headers.splice(index, 1);
        }
      }
    }]
  };
}]);
