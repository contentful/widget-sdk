'use strict';

angular.module('contentful')
.controller('EntryActionsController', ['$scope', 'require', 'notify', 'fields$', 'entityInfo', 'preferences', function ($scope, require, notify, fields$, entityInfo, preferences) {
  var controller = this;
  var Command = require('command');
  var spaceContext = require('spaceContext');
  var $state = require('$state');
  var Analytics = require('analytics/Analytics');
  var accessChecker = require('access_control/AccessChecker');
  var K = require('utils/kefir');
  var Notification = require('app/entity_editor/Notifications').Notification;

  var currentFields;
  K.onValueScope($scope, fields$, function (fields) {
    currentFields = fields;
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

  // Command options for the #add and #duplicate actions
  var options = {
    disabled: function () {
      return !canCreateEntry();
    }
  };

  controller.add = Command.create(
    function () {
      var contentType = getContentType(entityInfo);
      Analytics.track('entry_editor:created_with_same_ct', {
        contentTypeId: contentType.id,
        entryId: entityInfo.id
      });
      return spaceContext.space.createEntry(contentType.id, {})
      .then(goToEntryDetailWithTracking(contentType.type))
      .catch(function () { notify(Notification.Error('add')); });
    },
    options,
    { name: function () { return entityInfo.contentType.name; } }
  );

  controller.duplicate = Command.create(
    function () {
      var contentType = getContentType(entityInfo);
      return spaceContext.space.createEntry(contentType.id, {
        fields: currentFields
      })
      .then(goToEntryDetailWithTracking(contentType.type, { duplicate: true }))
      .catch(function () { notify(Notification.Error('duplicate')); });
    },
    options
  );

  function goToEntryDetailWithTracking (contentType, options) {
    var eventOrigin = options && options.duplicate
      ? 'entry-editor__duplicate'
      : 'entry-editor';
    return function (entry) {
      trackEntryCreation(eventOrigin, contentType, entry);
      goToEntryDetail(entry);
    };
  }

  function getContentType (entityInfo) {
    var contentTypeId = entityInfo.contentTypeId;
    return {
      id: contentTypeId,
      type: spaceContext.publishedCTs.get(contentTypeId)
    };
  }

  function trackEntryCreation (eventOrigin, contentType, response) {
    Analytics.track('entry:create', {
      eventOrigin: eventOrigin,
      contentType: contentType,
      response: response
    });
  }

  function goToEntryDetail (entry) {
    $state.go('^.detail', {
      entryId: entry.getId(),
      previousEntries: '',
      addToContext: false
    });
  }

  function canCreateEntry () {
    return accessChecker.canPerformActionOnEntryOfType(
      'create',
      entityInfo.contentTypeId
    );
  }
}]);
