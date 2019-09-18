import _ from 'lodash';
import sinon from 'sinon';

/**
 * @ngdoc module
 * @name contentful/mocks
 * @description
 * This module provides mocks for business domain objects.
 *
 * Mocked objects include the API clients `Space`, `ContentType`,
 * `Entry` and `Asset` classes.
 */
angular
  .module('contentful/mocks', [])
  .config([
    '$provide',
    '$controllerProvider',
    ($provide, $controllerProvider) => {
      $provide.value('$exceptionHandler', e => {
        throw e;
      });

      $provide.removeDirectives = function(...args) {
        _.flatten(args).forEach(directive => {
          const fullName = directive + 'Directive';
          $provide.factory(fullName, () => []);
        });
      };

      $provide.removeControllers = function(...args) {
        _.flatten(args).forEach(controller => {
          $controllerProvider.register(controller, angular.noop);
        });
      };

      $provide.makeStubs = function makeStubs(stubList) {
        if (!_.isArray(stubList)) stubList = _.flatten(arguments);
        const stubs = {};
        _.each(stubList, val => {
          stubs[val] = sinon.stub();
        });
        return stubs;
      };
    }
  ])
  .constant('lodash/debounce', _.identity)
  .constant('lodash/throttle', _.identity)
  .constant('lodash/defer', function(f) {
    const args = _.tail(arguments);
    f.apply(this, args);
  })
  .constant('lodash/delay', function(f) {
    const args = _.drop(arguments, 2);
    f.apply(this, args);
  })
  .constant('delayedInvocationStub', originalFunction => {
    let result;
    function delayedFunction(...args) {
      delayedFunction.calls.push({
        thisArg: this,
        arguments: args
      });
      return result;
    }
    delayedFunction.calls = [];
    delayedFunction.invokeDelayed = function() {
      const call = this.calls.shift();
      result = originalFunction.apply(call.thisArg, call.arguments);
    };
    delayedFunction.invokeAll = function() {
      while (this.calls.length > 0) {
        this.invokeDelayed();
      }
    };
    return delayedFunction;
  })
  .constant('icons', {});

/**
 * @ngdoc module
 * @name contentful/test
 *
 */

angular.module('contentful/test', ['contentful/app-config', 'contentful/mocks']);
