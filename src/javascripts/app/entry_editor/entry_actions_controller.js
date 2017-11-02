'use strict';

angular.module('contentful')
.controller('EntryActionsController', ['$scope', 'require', 'notify', 'fields$', 'entityInfo', 'preferences', function ($scope, require, notify, fields$, entityInfo, preferences) {
  var controller = this;
  var Command = require('command');
  var spaceContext = require('spaceContext');
  var $state = require('$state');
  var Analytics = require('analytics/Analytics');
  var accessChecker = require('accessChecker');
  var K = require('utils/kefir');
  var Notification = require('app/entity_editor/Notifications').Notification;

  var currentFields;
  K.onValueScope($scope, fields$, function (fields) {
    currentFields = fields;
  });

  controller.duplicate = Command.create(function () {
    return spaceContext.space.createEntry(
      entityInfo.contentTypeId,
      {fields: currentFields}
    )
    .then(function (entry) {
      $state.go('spaces.detail.entries.detail', {
        entryId: entry.getId(),
        addToContext: false
      });
    })
    .catch(function () {
      notify(Notification.Error('duplicate'));
    });
  }, {
    disabled: function () { return !canCreateEntry(); }
  });

  controller.toggleDisabledFields = Command.create(function () {
    var show = !preferences.showDisabledFields;
    preferences.showDisabledFields = show;
    Analytics.track('entry_editor:disabled_fields_visibility_toggled', {
      entryId: entityInfo.id,
      show: show
    });
  }, {}, {
    label: function () {
      return preferences.showDisabledFields
        ? 'Hide disabled fields'
        : 'Show disabled fields';
    }
  });

  controller.add = Command.create(function () {
    var contentTypeId = entityInfo.contentTypeId;
    Analytics.track('entry_editor:created_with_same_ct', {
      contentTypeId: contentTypeId,
      entryId: entityInfo.id
    });

    return spaceContext.space.createEntry(contentTypeId, {})
    .then(function (entry) {
      // TODO Create a service that works like $state.go but cancels
      // anythings if the state has changed in the meantime
      $state.go('spaces.detail.entries.detail', {
        entryId: entry.getId(),
        addToContext: false
      });
    });
    // TODO error handler
  }, {
    disabled: function () { return !canCreateEntry(); }
  }, {
    name: function () { return entityInfo.contentType.name; }
  });


  function canCreateEntry () {
    return accessChecker.canPerformActionOnEntryOfType('create', entityInfo.contentTypeId);
  }
}]);
