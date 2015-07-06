'use strict';

/**
 * @ngdoc module
 * @name contentful/test
 *
 * @description
 * If this module is loaded it will provide extra methods to `sinon`
 * stubs.
 *
 * ~~~js
 * // Creates a function that returns a rejected promise
 * sinon.stub().rejects(new Error())
 * // Creates a function that returns a resolved promise
 * sinon.stub().resolves('hello')
 * ~~~
 *
 */
angular.module('contentful/test', ['contentful', 'contentful/mocks'])
.run(['$q', function ($q) {

  sinon.stub.rejects = function (err) {
    return this.returns($q.reject(err));
  }

  sinon.stub.resolves = function (value) {
    return this.returns($q.reject(value));
  }
}])
