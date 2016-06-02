angular.module('contentful/mocks')

.value('debounce', _.identity)
.value('throttle', _.identity)

.value('defer', function (f) {
  var args = _.rest(arguments);
  f.apply(this, args);
})

.value('delay', function (f) {
  var args = _.rest(arguments, 2);
  f.apply(this, args);
})


.constant('delayedInvocationStub', function (originalFunction) {
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
})


.constant('createQueuedDebounce', function () {
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
});
