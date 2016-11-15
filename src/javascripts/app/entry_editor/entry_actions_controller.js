'use strict';

angular.module('contentful')
.controller('EntryActionsController', ['$scope', 'require', 'notify', function ($scope, require, notify) {

  var controller = this;
  var Command = require('command');
  var spaceContext = require('spaceContext');
  var $state = require('$state');
  var analytics = require('analytics');
  var accessChecker = require('accessChecker');

  function canCreateEntry () {
    var ctId = dotty.get($scope, 'entry.data.sys.contentType.sys.id');
    return accessChecker.canPerformActionOnEntryOfType('create', ctId);
  }

  controller.duplicate = Command.create(function () {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, ['sys']);

    return $scope.spaceContext.space.createEntry(contentType, data)
    .then(function (entry) {
      $state.go('spaces.detail.entries.detail', {
        entryId: entry.getId(),
        notALinkedEntity: true
      });
    })
    .catch(notify.duplicateFail);
  }, {
    disabled: function () { return !canCreateEntry(); }
  });

  controller.toggleDisabledFields = Command.create(function () {
    var show = !$scope.preferences.showDisabledFields;
    $scope.preferences.showDisabledFields = show;
    analytics.track('entry_editor:disabled_fields_visibility_toggled', {
      entryId: $scope.entry.getId(),
      show: show
    });
  }, {}, {
    label: function () {
      return $scope.preferences.showDisabledFields
        ? 'Hide disabled fields'
        : 'Show disabled fields';
    }
  });

  controller.add = Command.create(function () {
    var contentTypeId = $scope.entry.getSys().contentType.sys.id;
    analytics.track('entry_editor:created_with_same_ct', {
      contentTypeId: contentTypeId,
      entryId: $scope.entry.getId()
    });

    return spaceContext.space.createEntry(contentTypeId, {})
    .then(function (entry) {
      // TODO Create a service that works like $state.go but cancels
      // anythings if the state has changed in the meantime
      $state.go('spaces.detail.entries.detail', {
        entryId: entry.getId(),
        notALinkedEntity: true
      });
    });
    // TODO error handler
  }, {
    disabled: function () { return !canCreateEntry(); }
  }, {
    name: function () { return $scope.contentTypeName; }
  });
}]);
