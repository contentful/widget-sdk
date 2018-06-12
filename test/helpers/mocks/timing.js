angular.module('contentful/mocks')

.value('debounce', _.identity)
.value('throttle', _.identity)

.value('defer', function (f) {
  const args = _.tail(arguments);
  f.apply(this, args);
})

.value('delay', function (f) {
  const args = _.drop(arguments, 2);
  f.apply(this, args);
})


.constant('delayedInvocationStub', originalFunction => {
  let result;
  function delayedFunction () {
    delayedFunction.calls.push({
      thisArg: this,
      arguments: arguments
    });
    return result;
  }
  delayedFunction.calls = [];
  delayedFunction.invokeDelayed = function () {
    const call = this.calls.shift();
    result = originalFunction.apply(call.thisArg, call.arguments);
  };
  delayedFunction.invokeAll = function () {
    while (this.calls.length > 0) {
      this.invokeDelayed();
    }
  };
  return delayedFunction;
})


.constant('createQueuedDebounce', () => {
  function debounce (fn) {
    return function () {
      debounce.queue.push({fn: fn, args: arguments});
    };
  }

  debounce.queue = [];
  debounce.flush = () => {
    debounce.queue.forEach(call => {
      call.fn.apply(null, call.args);
    });
  };

  return debounce;
});
