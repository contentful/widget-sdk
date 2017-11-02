import * as sinon from 'helpers/sinon';

// TODO This module is deprecated. We should move stuff to
// 'test/helpers/TestCaseContext'

/**
 * @ngdoc service
 * @name helpers
 * @usage[js]
 * it('resolves the promise', function () {
 *   this.$apply();
 * })
 *
 * @description
 * The methods exposed by this service are available on the `this`
 * object in the test runner.
 */
beforeEach(function () {
  /**
   * @ngdoc method
   * @name helpers#$inject
   * @description
   * Obtain a service from the angular module used in this test
   *
   * @param {string} service
   * @return {any}
   */
  this.$inject = function (serviceName) {
    if (!this.$injector) {
      const self = this;
      inject(function ($injector) {
        self.$injector = $injector;
      });
    }
    return this.$injector.get(serviceName);
  };

  /**
   * @ngdoc method
   * @name helpers#$apply
   * @description
   * Call `$apply` on the root scope.
   */
  this.$apply = function () {
    this.$inject('$rootScope').$apply();
  };


  /**
   * @ngdoc method
   * @name helpers#$flush
   * @description
   * Call `$apply` on the root scope and flush outstanding timeout
   * callbacks and mock HTTP responses.
   */
  this.$flush = function () {
    const $http = this.$inject('$httpBackend');
    const $timeout = this.$inject('$timeout');

    // We need to run this multiple times because flushing an HTTP
    // response might change something that requires another apply.
    _.times(3, () => {
      this.$apply();
      // We ignore errors when there is nothing to be flushed
      try {
        $timeout.flush();
      } catch (error) {
        if (error.message !== 'No deferred tasks to be flushed') {
          throw error;
        }
      }
      try {
        $http.flush();
      } catch (error) {
        if (error.message !== 'No pending request to flush !') {
          throw error;
        }
      }
    });
  };


  /**
   * @ngdoc method
   * @name helpers#resolve
   * @description
   * Return a `$q` promise that resolves with the given value.
   *
   * @param {any} value
   * @return {Promise<any>}
   */
  this.resolve = function (val) {
    return this.$inject('$q').when(val);
  };

  // DEPRECATED
  this.when = this.resolve;

  /**
   * @ngdoc method
   * @name helpers#reject
   * @description
   * Return a `$q` promise that is rejected with the given error.
   *
   * @param {Error} error
   * @return {Promise<any>}
   */
  this.reject = function (err) {
    return this.$inject('$q').reject(err);
  };

  /**
   * @ngdoc method
   * @name helpers#$compile
   * @description
   * Creates a new scope with the given properties and compile the HTML
   * string with that scope. Returns the compiled JQuery element.
   *
   * To retrieve the scope use `element.scope()`.
   * If the element has an isolated scope, use `element.isolateScope()`.
   *
   * The element is attached to the document’s '<body>' element. It is
   * automatically destroyed and removed from the DOM in an `afterEach`
   * hook. See `test/helpers/hooks` for details.
   *
   * @param {string} template
   * @param {object} scopeProperties
   * @param {object} controllers Object with controller names as keys and controller
   *                 instances as values
   * @return {JQueryElement}
   */
  this.$compile = function (template, scopeProperties, controllers) {
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    const scope = _.extend($rootScope.$new(true), scopeProperties);
    let transcludeControllers = {};

    if (controllers) {
      // convert controllers to a form `$compile` understands
      transcludeControllers = _.mapValues(controllers, function (controllerInstance) {
        return {
          instance: controllerInstance
        };
      });
    }

    const element = $compile(template)(scope, undefined, {
      transcludeControllers: transcludeControllers
    });

    element.appendTo('body');
    this._angularElements.push(element);

    scope.$digest();
    return element;
  };

  /**
   * @ngdoc method
   * @name helpers#$compileWith
   * @description
   * Compiles a given element and attaches it to a new scope and
   * returns the compiled JQuery element.
   *
   * The `initScope` argument is a function that is called with the
   * new scope before the template is compiled.
   *
   * @param {string} template
   * @param {function} initScope
   * @return {JQueryElement}
   */
  this.$compileWith = function (template, initScope) {
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    const scope = $rootScope.$new(true);
    if (initScope) {
      initScope(scope);
    }

    const element = $compile(template)(scope);

    this._angularElements.push(element);
    scope.$digest();
    return element;
  };

  /**
   * @ngdoc method
   * @name helpers#mockService
   * @description
   * Stubs all methods on a service object.
   *
   * Resolves the service by name and calls `sinon.stub(service, prop)` for each
   * property that is a function. Returns the modified object.
   *
   * The optional second argument is used to extend the service object.
   * It only allows you to specify properties that already exist on the
   * service.
   *
   * @param {string} service
   * @param {object?} extension
   * @return {object}
   */
  this.mockService = function (name, extension) {
    const service = this.$inject(name);
    // We cannot use sinon.mock() because it will not add the
    // sinon.stub helpers like 'resolve()' etc.
    sinon.stubAll(service);
    /* eslint prefer-const: off */
    for (let key in extension) {
      if (!(key in service)) {
        throw new Error(`Property "${key}" does not exist on service`);
      }
      service[key] = extension[key];
    }
    return service;
  };

  /**
   * @ngdoc method
   * @name helpers#catchPromise
   * @description
   * Returns a promise that resolves with the rejection reason of the original
   * promise.
   *
   * It will reject when the original promise is resolved.
   *
   * @param {Promise<any>} promise
   * @return {Promise<Error>}
   */
  this.catchPromise = function (promise) {
    return promise.then(function () {
      throw new Error('Unexpectedly resolved promise');
    }, function (error) {
      return error;
    });
  };
});
