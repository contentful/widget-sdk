'use strict';

angular.module('contentful').factory('listActions', [
  '$q', '$timeout', '$rootScope', 'notification', 'analytics',
  function($q, $timeout, $rootScope, notification, analytics){

  var _params;

  var RETRY_TIMEOUT = 1000;

  var ERRORS = {
    TOO_MANY_REQUESTS: 429,
    NOT_FOUND: 404
  };

  function makeBatchResultsNotifier(word) {
    return function(results, length) {
      var hasFailed = function(r) { return r && r.err; };
      var failed = _.filter(results, hasFailed);
      var succeeded = length - failed.length;
      if (succeeded > 0)
        notification.info(succeeded+ ' '+ _params.entityNamePlural +' ' + word + ' successfully');
      if (failed.length > 0)
        notification.warn(failed.length+ ' '+ _params.entityNamePlural +' could not be ' + word);
    };
  }

  var callAction = function (entity, params, deferred) {
    var args = [function(err, changedEntity){
      if(err){
        if(err.statusCode === ERRORS.TOO_MANY_REQUESTS)
          $timeout(_.partial(callAction, entity, params, deferred), RETRY_TIMEOUT);
        else if(err.statusCode === ERRORS.NOT_FOUND){
          entity.setDeleted();
          $rootScope.$broadcast('entityDeleted', entity);
          deferred.resolve();
        } else
          deferred.reject({err: err});
      } else {
        if(params.event)
          $rootScope.$broadcast(params.event, changedEntity);
        deferred.resolve();
      }
    }];

    if(params.methodArgGetters){
      args.unshift.apply(args, _.map(params.methodArgGetters, function (getter) {
        return entity[getter] && entity[getter]();
      }));
    }

    entity[params.method].apply(entity, args);
  };

  var perform = function(params) {
    var selected = _params.getSelected();
    var actionCallback = params.actionCallback || callAction;
    var results = [];

    var actionCalls = _.map(selected, function (entity, idx, selected) {
      var deferred = $q.defer();
      var call = _.partial(actionCallback, entity, params, deferred);

      var handler = function (res) {
        results.push(res || {});
        var next = actionCalls[idx+1];
        if(next) next(res);
        else handlePerformResult(results, params, selected.length);
      };

      deferred.promise.then(handler).catch(handler);
      return call;
    });

    if(actionCalls.length) {
      actionCalls[0]();
    }
  };

  var handlePerformResult = function (results, params, length) {
    params.callback(results, length);
    _params.clearSelection();
    analytics.track('Performed '+ _params.entityName +'List action', {action: params.method});
  };


  return {
    createPerformer: function (params) {
      _params = params;
      return {
        perform: perform,
        makeBatchResultsNotifier: makeBatchResultsNotifier,
        RETRY_TIMEOUT: RETRY_TIMEOUT,
        ERRORS: ERRORS
      };
    }
  };
  }]
);
