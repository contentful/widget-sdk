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
$ xvfb-run karma start --browsers SlimerJS
~~~


Testing DSL
-----------

We extend Jasmine’s testing DSL with a couple of features. The DSL functions are
defined in `test/helpers/dsl.js`.

To select only a subsect of specs to run, replace their respective
`describe` or `it` calls with `fdescribe` or `fit`.

In the context of a test we make varous helpers available. They are documented
in the [Test module][module:test].

### Generators

You can write asynchronous tests using generator functions.
~~~js
it('a generator test', function* () {
  const value = yield this.resolve('X')
  expect(value).toBe('X')
})
~~~
You must always yield a promise. `$rootScope.$apply()` will be called after each
yield and before control is handed back to the generator.

If you need more control over Angular’s digest cycle and the promise resolution
consider using spies.
~~~js
it('test promise', function () {
  const success = sinon.spy()
  this.resolve('X').then(success)
  sinon.assert.notCalled(success)
  this.$apply()
  sinon.assert.calledWith(success, 'X')
})
~~~

### Setup

If you define a `this.setup` method in one of your `before` hooks this method is
run just before executing a test case. The method may return a promise this the
resolved value passed to the test runner.

~~~js
beforeEach(function () {
  this.setup = function () {
    return Promise.resolve(this.params)
  }
})
describe('with params', function () {
  beforeEach(function () {
    this.params = true
  })
  it('receives params', function (params) {
    expect(params).toBe(true)
  })
})
~~~


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
