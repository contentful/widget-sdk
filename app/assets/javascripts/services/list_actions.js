'use strict';

angular.module('contentful').factory('listActions', ['$injector', function($injector){
  var $q           = $injector.get('$q');
  var $rootScope   = $injector.get('$rootScope');
  var $timeout     = $injector.get('$timeout');
  var analytics    = $injector.get('analytics');
  var cfSpinner    = $injector.get('cfSpinner');
  var notification = $injector.get('notification');

  var RETRY_TIMEOUT = 1000;

  var ERRORS = {
    TOO_MANY_REQUESTS: 429,
    NOT_FOUND: 404
  };

  function BatchPerformer(params) {
    this.params = params;
  }

  BatchPerformer.prototype = {
    getErrors: function () {
      return ERRORS;
    },

    getRetryTimeout: function () {
      return RETRY_TIMEOUT;
    },

    makeBatchResultsNotifier: function (word) {
      var self = this;
      return function batchResultsNotifier(results, length) {
        var hasFailed = function(r) { return r && r.err; };
        var failed = _.filter(results, hasFailed);
        var succeeded = length - failed.length;
        if (succeeded > 0)
          notification.info(succeeded+ ' '+ self.params.entityNamePlural +' ' + word + ' successfully');
        if (failed.length > 0)
          notification.warn(failed.length+ ' '+ self.params.entityNamePlural +' could not be ' + word);
      };
    },

    callAction: function (entity, params) {
      var self = this;
      var args = [];

      if(params.getterForMethodArgs){
        args.unshift.apply(args, _.map(params.getterForMethodArgs, function (getter) {
          return entity[getter] && entity[getter]();
        }));
      }

      return entity[params.method].apply(entity, args)
      .then(function(changedEntity){
        if(params.event)
          $rootScope.$broadcast(params.event, changedEntity);
      })
      .catch(function(err){
        if(err.statusCode === ERRORS.TOO_MANY_REQUESTS)
          return $timeout(_.partial(self.callAction, entity, params), RETRY_TIMEOUT);
        else if(err.statusCode === ERRORS.NOT_FOUND){
          entity.setDeleted();
          $rootScope.$broadcast('entityDeleted', entity);
          return $q.when();
        } else
          return $q.reject({err: err});
      });
    },

    perform: function(params) {
      var self = this;
      var selected = this.params.getSelected();
      var actionCallback = params.actionCallback || _.bind(this.callAction, this);
      var results = [];

      var actionCalls = _.map(selected, function (entity, idx, selected) {
        var stopSpinner = cfSpinner.start();

        var handler = function actionHandler(res) {
          stopSpinner();
          results.push(res || {});
          var next = actionCalls[idx+1];
          if(next) next();
          else self.handlePerformResult(results, params, selected.length);
        };

        return function actionCall(){
          actionCallback(entity, params)
          .then(handler)
          .catch(handler);
        };
      });

      if(actionCalls.length) {
        actionCalls[0]();
      }
    },

    handlePerformResult: function (results, params, length) {
      params.callback(results, length);
      this.params.clearSelection();
      analytics.track('Performed '+ this.params.entityName +'List action', {action: params.method});
    }
  };


  /**
   * Pass an array of functions. The function are expected to return promises.
   *
   * They will be called in serial. If a call fails and error.statusCode is 429 (Too many requests)
   * it will be retried.
   */
  var serialize = function (calls) {
    if (calls.length === 0) return $q.when([]);

    calls = calls.concat();
    var call = calls.shift();

    function errorHandler(err) {
      if(err && err.statusCode === ERRORS.TOO_MANY_REQUESTS) {
        return $timeout(function () {
          calls.unshift(call);
          return serialize(calls);
        }, RETRY_TIMEOUT);
      } else {
        return $q.reject(err);
      }
    }

    return call().then(function (result) {
      return serialize(calls).then(function (otherResults) {
        return [result].concat(otherResults);
      }, errorHandler);
    }, errorHandler);
  };

  return {
    serialize: serialize,
    createBatchPerformer: function (params) {
      return new BatchPerformer(params);
    }
  };
}]);
