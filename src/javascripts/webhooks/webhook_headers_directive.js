'use strict';

angular.module('contentful')

.directive('cfWebhookHeaders', ['require', require => {
  var Command = require('command');
  var $timeout = require('$timeout');

  return {
    restrict: 'E',
    template: JST['webhook_headers'](),
    scope: {headers: '=', isDirty: '='},
    link: function (scope, el) {
      scope.focusNewKey = () => {
        el.find('#webhook-new-header-key').focus();
      };
      scope.focusFirst = () => {
        el.find('input:visible').first().focus();
      };
    },
    controller: ['$scope', $scope => {
      $scope.model = {fresh: {}, existing: {}};
      $scope.add = Command.create(add, {disabled: cannotAdd});
      $scope.addWithEnter = addWithEnter;
      $scope.edit = edit;
      $scope.update = update;
      $scope.isEditing = isEditing;
      $scope.canUpdate = canUpdate;
      $scope.updateWithEnter = updateWithEnter;
      $scope.remove = remove;

      $scope.$watchCollection('model.fresh', m => {
        $scope.isDirty = !!(m.key && m.value);
      });

      function add () {
        var m = $scope.model.fresh;
        $scope.headers.push({key: m.key, value: m.value});
        $scope.model.fresh = {};
        $scope.focusNewKey();
      }

      function cannotAdd () {
        var m = $scope.model.fresh;
        return !m.key || !m.value || _.find($scope.headers, {key: m.key});
      }

      function addWithEnter ($event) {
        if ($event.which === 13 && !cannotAdd()) {
          add();
        }
      }

      function edit (header) {
        var m = $scope.model.existing;
        m.editing = header;
        if (header) {
          m.value = header.value;
          $timeout($scope.focusFirst);
        }
      }

      function isEditing (header) {
        return $scope.model.existing.editing === header;
      }

      function update () {
        var m = $scope.model.existing;
        if (m.editing) {
          m.editing.value = m.value;
          edit(null);
        }
      }

      function canUpdate () {
        var m = $scope.model.existing;
        return m.editing && m.value;
      }

      function updateWithEnter ($event) {
        if ($event.which === 13 && canUpdate()) {
          update();
        } else if ($event.which === 27) {
          edit(null);
        }
      }

      function remove (header) {
        var index = $scope.headers.indexOf(header);
        if (index > -1) {
          $scope.headers.splice(index, 1);
        }
      }
    }]
  };
}]);
