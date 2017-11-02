'use strict';

angular.module('contentful').factory('batchPerformer', ['require', function (require) {
  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var Analytics = require('analytics/Analytics');
  var notification = require('notification');

  var ACTION_NAMES = {
    publish: 'published',
    unpublish: 'unpublished',
    archive: 'archived',
    unarchive: 'unarchived',
    delete: 'deleted',
    duplicate: 'duplicated'
  };

  var ENTITY_PLURAL_NAMES = {
    Entry: 'Entries',
    Asset: 'Assets'
  };

  return {create: createBatchPerformer};

  function createBatchPerformer (config) {
    return _.transform(_.keys(ACTION_NAMES), function (acc, action) {
      acc[action] = _.partial(run, action);
    }, {});

    function run (method) {
      var actions = _.map(config.getSelected(), function (entity) {
        return performAction(entity, method);
      });

      return $q.all(actions)
      .then(function handleResults (results) {
        results = groupBySuccess(results);
        notifyBatchResult(method, results);
        if (_.isFunction(config.onComplete)) { config.onComplete(); }
        Analytics.track('search:bulk_action_performed', {
          entityType: config.entityType,
          action: method
        });
        return results;
      });
    }

    function performAction (entity, method) {
      var request = _.partial(call, entity, method);
      var handleError = _.partial(handleEntityError, entity);

      return request()
      .then(handleSuccess, handleError);
    }

    function handleSuccess (entity) {
      return {entity: entity};
    }

    function handleEntityError (entity, err) {
      if (err && err.statusCode === 404) {
        entity.setDeleted();
        config.onDelete(entity);
        return handleSuccess(entity);
      } else {
        return {err: err};
      }
    }

    function call (entity, method) {
      if (method === 'duplicate') {
        return callDuplicate(entity);
      } else if (method === 'delete') {
        return callDelete(entity);
      } else {
        return entity[method]();
      }
    }

    function callDuplicate (entity) {
      var sys = entity.getSys();
      if (sys.type === 'Entry') {
        var ctId = _.get(sys, 'contentType.sys.id');
        var data = _.omit(entity.data, 'sys');
        return spaceContext.space.createEntry(ctId, data);
      } else {
        return $q.reject(new Error('Only entries can be duplicated'));
      }
    }

    function callDelete (entity) {
      return entity.delete()
      .then(function () {
        config.onDelete(entity);
        return entity;
      });
    }

    function groupBySuccess (results) {
      return _.transform(results, function (acc, result) {
        var key = result.err ? 'failed' : 'succeeded';
        acc[key].push(result[result.err ? 'err' : 'entity']);
      }, {failed: [], succeeded: []});
    }

    function notifyBatchResult (method, results) {
      var actionName = ACTION_NAMES[method];
      var entityName = ENTITY_PLURAL_NAMES[config.entityType];

      if (results.succeeded.length > 0) {
        notification.info(results.succeeded.length + ' ' + entityName + ' ' + actionName + ' successfully');
      }
      if (results.failed.length > 0) {
        notification.warn(results.failed.length + ' ' + entityName + ' could not be ' + actionName);
      }
    }
  }
}]);
