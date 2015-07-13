Testing
=======

This guide describes the testing setup and helpers for the UI. See also
the API documentation of the [`test` module][module:test]

Tests are written in [Jasmine][jasmine] and run with [Karma][karma].
The tests use [Sinon][sinon] to create function stubs. The tests files
are contained in `test/unit` and `test/integration`, helpers are
contained in `test/helpers`. To see a list of available test helpers
go to the [`test` module][module:test] documentation.

You can run the tests with
~~~bash
$ npm install -g karma-cli gulp-cli
$ gulp prepare-tests
$ xvfb-run karma --browsers SlimerJS
~~~


Focused Tests
-------------

To select only a subsect of specs to run, replace their respective
`describe` or `it` calls with `ddescribe` or `iit`.


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


Mocks
-----

Use `sinon.stub()` to create mock functions and `sinon.assert` to make
assertions.

We provide two extensions to Sinon stubs that allow you to create
functions that return promises.

~~~js
// Equivalent: Function that returns a resolved promise
sinon.stub().returns($q.when('yeah'))

// Equivalent: Function that returns a rejected promise
var callAndReject = sinon.stub().rejects(new Error())
sinon.stub().returns($q.reject(new Error()))
~~~

There is a `mocks` module and a `cfStub` service that provide elaborate
mocks for certain parts of the app. Use of this module is *deprecated*
and needs some major cleanup.


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
