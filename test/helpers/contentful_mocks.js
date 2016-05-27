'use strict';


angular.module('cf.ui')
// We do not load the file containing the icons. Therefore we need to
// create a dummy service.
.constant('icons', {});


/**
 * @ngdoc module
 * @name contentful/mocks
 * @description
 * This module provides mocks for business domain objects.
 *
 * Mocked objects include the API clients `Space`, `ContentType`,
 * `Entry` and `Asset` classes.
 */
angular.module('contentful/mocks', [])

.decorator('TheStore/localStorageWrapper',
['$delegate', 'mocks/TheStore/localStorageWrapper',
function ($delegate, mock) {
  return _.extend({
    _noMock: $delegate
  }, mock);
}])

.config(['$provide', function ($provide) {
  $provide.value('$exceptionHandler', function (e) {
    throw e;
  });

  $provide.decorator('ReloadNotification', ['$delegate', function ($delegate) {
    for (var prop in $delegate) {
      sinon.stub($delegate, prop);
    }
    return $delegate;
  }]);

  $provide.provider('realLogger', function (loggerProvider) {
    return loggerProvider;
  });

  $provide.provider('realNotification', function (notificationProvider) {
    return notificationProvider;
  });

  $provide.factory('logger', function () {
    return {
      enable: sinon.stub(),
      disable: sinon.stub(),
      logException: sinon.stub(),
      logError: sinon.stub(),
      logServerError: sinon.stub(),
      logServerWarn: sinon.stub(),
      logSharejsError: sinon.stub(),
      logSharejsWarn: sinon.stub(),
      logWarn: sinon.stub(),
      log: sinon.stub()
    };
  });

  $provide.factory('notification', function () {
    return {
      error: sinon.stub(),
      warn: sinon.stub(),
      info: sinon.stub()
    };
  });

}])

.config(function ($provide) {
  $provide.value('debounce', immediateInvocationStub);
  $provide.value('throttle', immediateInvocationStub);
  $provide.value('defer', noDeferStub);
  $provide.value('delay', noDelayStub);
  $provide.constant('delayedInvocationStub', delayedInvocationStub);

  function noDeferStub (f) {
    var args = _.rest(arguments);
    f.apply(this, args);
  }

  function noDelayStub (f/*, delay*/) {
    var args = _.rest(arguments, 2);
    f.apply(this, args);
  }

  function immediateInvocationStub (f) {
    return f;
  }

  function delayedInvocationStub (originalFunction) {
    var result;
    function delayedFunction () {
      delayedFunction.calls.push({
        thisArg: this,
        arguments: arguments
      });
      return result;
    }
    delayedFunction.calls = [];
    delayedFunction.invokeDelayed = function () {
      var call = this.calls.shift();
      result = originalFunction.apply(call.thisArg, call.arguments);
    };
    delayedFunction.invokeAll = function () {
      while (this.calls.length > 0) {
        this.invokeDelayed();
      }
    };
    return delayedFunction;
  }
})

.constant('debounceQueue', (function () {
  function debounce (fn) {
    return function () {
      debounce.queue.push({fn: fn, args: arguments});
    };
  }

  debounce.queue = [];
  debounce.flush = function () {
    debounce.queue.forEach(function (call) {
      call.fn.apply(null, call.args);
    });
  };

  return debounce;
})())

.config(['environment', function (environment) {
  environment.settings.marketing_url = '//example.com';
}])

.config(['$provide', '$controllerProvider', function ($provide, $controllerProvider) {
  $provide.stubDirective = function (name, definition) {
    $provide.factory(name + 'Directive', function () {
      return [_.extend({
        name: name,
        restrict: 'A',
        priority: 0
      }, definition)];
    });
  };

  $provide.removeDirectives = function () {
    _.flatten(arguments).forEach(function (directive) {
      var fullName = directive + 'Directive';
      $provide.factory(fullName, function () {
        return [];
      });
    });
  };

  $provide.removeController = function (label, fakeController) {
    $controllerProvider.register(label, fakeController || angular.noop);
  };

  $provide.removeControllers = function () {
    _.flatten(arguments).forEach(function (controller) {
      $controllerProvider.register(controller, angular.noop);
    });
  };

  $provide.stubFilter = function (filterName, returnValue) {
    $provide.value(filterName + 'Filter', function () { return returnValue || ''; });
  };

  $provide.makeStubs = function makeStubs (stubList) {
    if (!_.isArray(stubList)) {
      stubList = _.flatten(arguments);
    }
    var stubs = {};
    _.each(stubList, function (val) {
      stubs[val] = sinon.stub();
    });
    return stubs;
  };

}]);
