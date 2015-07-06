'use strict';

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
  this.$inject = function(serviceName){
    if (!this.$injector) {
      var self = this;
      inject(function($injector){
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
   * To retrieve the scope use `element.scope()`
   *
   * @param {string} template
   * @param {object} scopeProperties
   * @return {JQueryElement}
   */
  this.$compile = function (template, scopeProperties) {
    var $compile = this.$inject('$compile');
    var $rootScope = this.$inject('$rootScope');
    var scope = _.extend($rootScope.$new(true), scopeProperties);
    var element = $compile(template)(scope);
    scope.$digest();
    return element;
  };

});
