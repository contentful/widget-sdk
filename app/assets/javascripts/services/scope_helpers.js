'use strict';
angular.module('contentful').run(['$rootScope', '$q', function($rootScope, $q){

  // Wait until exp return true-ish, then run fn once
  $rootScope.waitFor = function (exp, fn, eq) {
    var deferred = $q.defer();
    var d = this.$watch(exp, function(n, old, scope){
      if (n) {
        try {
          if (fn) fn(n, old, scope);
        } finally {
          deferred.resolve(n);
          d();
          d = null;
        }
      }
    }, eq);

    this.$on('$destroy', function () {
      if (d) {
        d();
        d=null;
      }
      deferred.reject();
    });

    return deferred.promise;
  };

  // Handle an event exactly once
  $rootScope.one = function (event, handler) {
    var deferred = $q.defer();
    var d = this.$on(event, function () {
      try {
        if (handler) handler.apply(undefined, arguments);
      } finally {
        deferred.resolve(arguments);
        d();
        d = null;
      }
    });
    this.$on('$destroy', function () {
      if (d) {
        d();
        d=null;
      }
      deferred.reject();
    });

    return deferred.promise;
  };

  $rootScope.$watchGroup = function(watchExpressions, listener) {
    var oldValues = new Array(watchExpressions.length);
    var newValues = new Array(watchExpressions.length);
    var deregisterFns = [];
    var self = this;
    var changeReactionScheduled = false;
    var firstRun = true;

    if (!watchExpressions.length) {
      // No expressions means we call the listener ASAP
      var shouldCall = true;
      self.$evalAsync(function () {
        if (shouldCall) listener(newValues, newValues, self);
      });
      return function deregisterWatchGroup() {
        shouldCall = false;
      };
    }

    if (watchExpressions.length === 1) {
      // Special case size of one
      return this.$watch(watchExpressions[0], function watchGroupAction(value, oldValue, scope) {
        newValues[0] = value;
        oldValues[0] = oldValue;
        listener(newValues, (value === oldValue) ? newValues : oldValues, scope);
      });
    }

    _.each(watchExpressions, function (expr, i) {
      var unwatchFn = self.$watch(expr, function watchGroupSubAction(value, oldValue) {
        newValues[i] = value;
        oldValues[i] = oldValue;
        if (!changeReactionScheduled) {
          changeReactionScheduled = true;
          self.$evalAsync(watchGroupAction);
        }
      });
      deregisterFns.push(unwatchFn);
    });

    function watchGroupAction() {
      changeReactionScheduled = false;

      if (firstRun) {
        firstRun = false;
        listener(newValues, newValues, self);
      } else {
        listener(newValues, oldValues, self);
      }
    }

    return function deregisterWatchGroup() {
      while (deregisterFns.length) {
        deregisterFns.shift()();
      }
    };
  };
}]);
