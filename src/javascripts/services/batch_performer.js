'use strict';

angular.module('contentful').factory('batchPerformer', ['$injector', function ($injector) {

  var $q           = $injector.get('$q');
  var $timeout     = $injector.get('$timeout');
  var spaceContext = $injector.get('spaceContext');
  var analytics    = $injector.get('analytics');
  var notification = $injector.get('notification');

  return function createBatchPerformer (config) {

    return {
      makeResultNotifier: makeResultNotifier,
      run: run
    };

    function makeResultNotifier (actionName) {
      return function notifyBatchResult (succeeded, failed) {
        if (succeeded.length > 0) {
          notification.info(succeeded.length + ' ' + config.entityNamePlural + ' ' + actionName + ' successfully');
        }
        if (failed.length > 0) {
          notification.warn(failed.length + ' ' + config.entityNamePlural + ' could not be ' + actionName);
        }
      };
    }

    function run (params) {
      var selected = config.getSelected();
      var results = [];
      var pushResult = _.bind(results.push, results);

      var actions = _.map(selected, function (entity) {
        return performAction(entity, params.method)
        .then(pushResult, pushResult);
      });

      return $q.all(actions)
      .then(function handleResults () {
        var failed = _.filter(results, 'err');
        var succeeded = _.difference(results, failed);
        params.callback(succeeded, failed);
        config.clearSelection();
        analytics.track('Performed ' + config.entityName + ' list action', {action: params.method});
      });
    }

    function performAction (entity, method) {
      return call(entity, method)
      .catch(function handleError (err) {
        if (err.statusCode === 404) {
          entity.setDeleted();
          config.onDelete(entity);
          return $q.when(entity);
        } else if (err.statusCode === 429) {
          return $timeout(_.partial(performAction, entity, method), 1000);
        } else {
          return $q.reject({err: err});
        }
      });
    }

    function call (entity, method) {
      if (method === 'duplicate') {
        return callDuplicate(entity);
      } else if (method === 'delete') {
        return callDelete(entity);
      } else if (method === 'publish') {
        return entity.publish(entity.getVersion());
      } else {
        return entity[method]();
      }
    }

    function callDuplicate (entity) {
      var sys = entity.getSys();
      if (sys.type === 'Entry') {
        var ctId = dotty.get(sys, 'contentType.sys.id');
        var data = _.omit(entity.data, 'sys');
        return spaceContext.space.createEntry(ctId, data);
      } else {
        return $q.reject({err: new Error('Only entries can be duplicated')});
      }
    }

    function callDelete (entity) {
      return entity.delete()
      .then(function () {
        config.onDelete(entity);
        return $q.when(entity);
      });
    }
  };
}]);
