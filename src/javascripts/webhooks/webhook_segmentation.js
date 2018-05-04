'use strict';

angular.module('contentful')

.directive('cfWebhookSegmentation', ['require', function (require) {
  var segmentation = require('webhookSegmentation');

  var LABELS = {
    ContentType: 'Content type',
    Entry: 'Entry',
    Asset: 'Asset',
    create: 'Create',
    save: 'Save',
    auto_save: 'Autosave',
    archive: 'Archive',
    unarchive: 'Unarchive',
    publish: 'Publish',
    unpublish: 'Unpublish',
    delete: 'Delete'
  };

  return {
    restrict: 'E',
    template: JST['webhook_segmentation'](),
    scope: {topics: '='},
    link: function (scope) {
      scope.entityTypes = segmentation.ENTITY_TYPES;
      scope.actions = segmentation.ACTIONS;
      scope.availability = segmentation.ACTIONS_AVAILABILITY;
      scope.labels = LABELS;

      scope.selection = _.transform(scope.topics || [], function (acc, combination) {
        acc[combination] = true;
      }, {});

      scope.$watchCollection('selection', function () {
        scope.topics = segmentation.processSelection(scope.selection);
      });

      scope.toggle = function (event, entity, action) {
        if (!$(event.target).is('input') && scope.canToggle(entity, action)) {
          var key = entity + '.' + action;
          scope.selection[key] = !scope.selection[key];
        }
      };

      scope.canToggle = function (entity, action) {
        return entity === '*' || action === '*' ||
          !scope.isWildcarded(entity, action) &&
          scope.availability[entity][action];
      };

      scope.isWildcarded = function (entity, action) {
        return scope.selection[entity + '.*'] || scope.selection['*.' + action];
      };
    }
  };
}])

.factory('webhookSegmentation', function () {
  var ENTITY_TYPES = ['ContentType', 'Entry', 'Asset'];
  var ACTIONS = ['create', 'save', 'auto_save', 'archive', 'unarchive', 'publish', 'unpublish', 'delete'];

  return {
    ENTITY_TYPES: ENTITY_TYPES,
    ACTIONS: ACTIONS,
    ACTIONS_AVAILABILITY: getActionsAvailability(),
    processSelection: processSelection
  };

  function getActionsAvailability () {
    return _.transform(ENTITY_TYPES, function (acc, entityType) {
      acc[entityType] = _.transform(ACTIONS, function (acc, action) {
        acc[action] = isCombinationValid(entityType, action);
      }, {});
    }, {});
  }

  function isCombinationValid (entityType, action) {
    return !(entityType === 'ContentType' && _.includes(['auto_save', 'archive', 'unarchive'], action));
  }

  function processSelection (selection) {
    if (isSelected('*', '*')) { return ['*.*']; }

    var topics = _.transform(selection, function (acc, value, str) {
      if (value) { acc.push(str.split('.')); }
    }, []);

    _.forEach(ENTITY_TYPES, function (entityType) {
      if (isSelected(entityType, '*')) {
        topics = filterWildcarded(topics, entityType, 1);
      }
    });

    _.forEach(ACTIONS, function (action) {
      if (isSelected('*', action)) {
        topics = filterWildcarded(topics, action, 0);
      }
    });

    topics = _.map(topics, function (topic) {
      return topic.join('.');
    });

    return _.uniq(topics).sort();

    function isSelected (entityType, action) {
      return selection[[entityType, action].join('.')];
    }
  }

  function filterWildcarded (topics, fixedPart, wildcardIndex) {
    return _.filter(topics, function (topic) {
      return topic[wildcardIndex ? 0 : 1] !== fixedPart ||
             topic[wildcardIndex] === '*';
    });
  }
});
