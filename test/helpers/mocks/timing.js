import _ from 'lodash';

angular
  .module('contentful/mocks')

  .constant('lodash/debounce', _.identity)
  .constant('lodash/throttle', _.identity)

  .constant('lodash/defer', function (f) {
    const args = _.tail(arguments);
    f.apply(this, args);
  })

  .constant('lodash/delay', function (f) {
    const args = _.drop(arguments, 2);
    f.apply(this, args);
  })

  .constant('delayedInvocationStub', (originalFunction) => {
    let result;
    function delayedFunction(...args) {
      delayedFunction.calls.push({
        thisArg: this,
        arguments: args,
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
  });
