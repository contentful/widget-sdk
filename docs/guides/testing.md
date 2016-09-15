Testing
=======

This guide describes the testing setup and helpers for the UI. See also
the API documentation of the [`test` module][module:test]

Tests are written in [Jasmine][jasmine] (version `2.3.x`) and run with
[Karma][karma].  The tests use [Sinon][sinon] to create function stubs.
The tests files are contained in `test/unit` and `test/integration`,
helpers are contained in `test/helpers`. To see a list of available
test helpers go to the [`test/helpers` service][service:helpers] documentation.

You can run the tests with
~~~bash
$ npm install -g karma-cli gulp-cli
$ gulp prepare-tests
$ xvfb-run karma --browsers SlimerJS
~~~


Focused Tests
-------------

To select only a subsect of specs to run, replace their respective
`describe` or `it` calls with `fdescribe` or `fit`.


Using Angular
-------------

Each test case must load an Angular module using the `module` function.
Then we can use the `$inject` helper to obtain services from that
module.

~~~js
beforeEach(function () {
  module('contentful/test');
  var $q = this.$inject('$q');
})
~~~

The [`ngMock`][ng-mock] module is automatically required. The
`contentful/test` module includes the main `contentful` module and the
`contentful/mocks` module. The latter provides various services that
mock certain parts of the application.

Directives can be compiled and tested with the
[`$compile` helper][service:helpers].

~~~js
it('renders', function () {
  var $el = this.$compile('<span>{{{text}}}</span>', {text: 'Hello'})
  exepect($el.text()).toEqual('Hello')
})
~~~

If any of the compiled directives [`require`][require] the controller of another
directive you can pass it as shown below.

~~~js
angular.module('contentful')
.directive('myAwesomeDirective', [function () {
  return {
    require: '^customController'
  }
}])

// we want to compile `myAwesomeDirective`
var $el = this.$compile('<my-awesome-directive>', {somePropOnScope: 10}, {
  customController: instanceOfCustomController
})
~~~


Mocks and Stubs
---------------

Use `sinon.stub()` to create mock functions and `sinon.assert` to make
assertions. We provide a couple of extensions to Sinon stubs.

### Promises

The `stub.resolves(value)` method makes a stub return a resolved promise

~~~js
// Equivalent
sinon.stub().resolves('yeah')
sinon.stub().returns($q.resolve('yeah'))
~~~

The `stub.rejects(error)` method makes a stub return a rejected promise
~~~ js
// Equivalent
sinon.stub().rejects(new Error())
sinon.stub().returns($q.reject(new Error()))
~~~

The `stub.defers()` helper makes the stub return a promise that is not yet
resolved. One can use `stub.resolve()` and `stub.reject()` to resolve and reject
the promise.

~~~js
const stub = sinon.stub().defers()
stub().then(cb)
stub.resolves('val')
this.$apply()
// `cb` is called with 'val'
~~~

### Services

The `this.mockService()` helper mocks all methods in an Angular service.

Assume the `myService` service is an object that exports the `foo` and `bar`
methods.

~~~js
it('mocks a service', function () {
  const mock = this.mockService('myService', {
    bar: true
  })

  mock.foo.returns('foo')

  const service = this.$inject('myService')
  expect(service.foo()).toBe('foo')
  expect(service.bar).toBe(true)
})
~~~

The object passed to `this.mockService()` contains custom extensions to the
service. It only allows you to change properties that already exist on the
service.

There is a `mocks` module and a `cfStub` service that provide elaborate mocks
for certain parts of the app. Use of `cfStub` service is *deprecated* and needs
some major cleanup.


Asynchronous Tests
------------------

In test cases we can use the `this.resolve()` and `this.reject()`
helper methods to create promises. This is documented in the [Test
module][module:test].

There are two ways to test code that uses promises. The first is to
flush promises in a test case with `this.$apply()`

~~~js
it('will fail', function () {
  this.resolve('X')
  .then(function (value) {
    expect(value).toEqual('Y');
  })
  this.$apply()
})
~~~

The problem here is that the initial promise might be rejected and the
expectation never run.

To migitate this the `pit(name, runner)` DSL function creates a test
case that calls `runner` and wraps the result in a `$q` promise. The
test case only finishes when the promise is resolved. If the promise is
rejected, the test case fails with the rejection reason.

~~~js
describe('async tests', function () {
  pit('this will fail', function () {
    var rejected = this.reject(new Error('fail'))
    return this.resolve('X')
    .then(function (value) {
      expect(value).toEqual('X')
      return rejected
    })
  })
})
~~~


Reporters
---------

There a various reporters that display information on the progress of
the test run. You can choose a reporter by passing the
`--reporters <name>` option to karma.

- `nested` (*default*) shows a nested list of only the failing tests
- `dots` prints a dot for each run test case
- `mocha` shows a nested list of all tests
- [`tape`][tape] output style
- `specjson` outputs test results to a json file
- `nyan` lets the [Nyan Cat](http://www.nyan.cat) loose

[ng-mock]: https://docs.angularjs.org/api/ngMock
[sinon]: http://sinonjs.org/
[jasmine]: http://jasmine.github.io/2.0/introduction.html
[karma]: http://karma-runner.github.io/0.12/index.html
[module:test]: api/contentful/test
[tape]: https://github.com/substack/tape
[service:helpers]: api/contentful/test/service/helpers
[require]: https://docs.angularjs.org/api/ng/service/$compile#-require-
