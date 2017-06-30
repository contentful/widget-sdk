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
$ bin/install-slimerjs
$ gulp prepare-tests
$ karma start
~~~

Deprecated Patterns
-------------------

This is a list of patterns used in old code but deprecated.

* `pit()` DSL to create promise based tests. Use generator functions instead.
* `this.$inject()` for ES6 modules. Use native `import X from 'Y'` instead.
* Using the `$compile` service to compile directives. Use `this.$comile()`
  instead.
* Global `sinon`. Use `import sinon from 'helpers/sinon'` instead.
* `this.$inject('q')`. You can use `import $q from '$q'`.


Module System
-------------

Test files are only executed when their file name ends with `.spec.js`.

All files in the `test/` folder are treated as ES6 modules. Files in the
`test/helper/` directory can by imported with `import 'helpers/my-helper'`.
ES6 modules defined in the application code can also be loaded from test files.
Their name is relative to the `src/javascripts` folder.

~~~js
// test/unit/utils/Kefir.spec.js

import * as KM from 'helpers/mocks/kefir';
// from src/javscripts/utils.kefir.es6.js
import * as K from 'utils/kefir';

// ...
~~~

Unlike ES6 modules defined in the `src/` directory we can not import Angular
services in test files. To use Angular services that are not defined as ES6
modules see [“Using Angular”](#using-angular) below.

NPM packages can be imported in the tests using the `npm` prefix.

~~~js
import sinon from 'npm:sinon'
~~~

For performance reasons it is heavily advised to load a UMD distribution of the
file. This is defined in the SystemJS config in `test/system-config.js`.

~~~js
SystemJS.config({
  packages: {
    'npm:package-name': {
      main: 'dist/file.js'
      format: 'amd',
    }
  }
})
~~~

For more information see the [SystemJS config documentation][systemjs-config].

[systemjs-config]: https://github.com/systemjs/systemjs/blob/master/docs/config-api.md


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
  const $rootScope = this.$inject('$rootScope');
})
~~~

You can import the `$q` service directly instead of using `this.$inject()`.
~~~js
import $q from '$q';
~~~
Note that the methods on `$q` may only be called after the Angular module has
been instantiated.

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

### Individual methods

*For mocking an entire service, see [the next section](#services).*

If you want to mock only some methods in a dependency of the tested unit, but
leave other properties intact, you can simply inject it in the test and replace
these method with stubs:

~~~js
// foo.js
angular.module('contentful')

.service('foo', function (require) {
  var bar = require('bar');

  return function () {
    return bar.buzz();
  }
});

// unit test for 'foo'
before(function () {
  this.foo = this.$inject('foo');
  this.bar = this.$inject('bar');
  this.bar.buzz = sinon.stub().returns('herp');
});

it('should herp', function () {
  expect(this.foo()).toBe('herp');
});
~~~

However, this won't work if `foo` is an ES6 module:

~~~js
// Foo.es6.js
import * as bar from 'bar';

export function () {
  return bar.buzz();
}
~~~

All dependencies of ES6 modules are shallow-copied, so the changes that are
made to `bar` after it was imported in `foo` will not be applied to the
imported instance. However, if we change the order of imports in the test:

~~~js
before(function () {
  module('contentful/test');

  this.bar = this.$inject('bar');
  this.bar.buzz = sinon.stub().returns('herp');
  this.foo = this.$inject('foo');
});
~~~

Then import statement inside `Foo.es6.js` will be executed after we inject and
modify `bar`, and receive the modified version.

This also means that we currently cannot modify ES6 dependencies on the fly:

~~~js
// works with a es5 foo, but not with es6 :(
it('should derp', function () {
  this.bar.buzz = sinon.stub().returns('derp');
  expect(this.foo()).toBe('derp');
});
~~~


### Services

Use `this.mockService()` helper to mock *all* methods in an Angular service.

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

Note that for testing ES6 modules with mock services, imports order matters in
the same way as for [mock individual methods](#individual-methods).

There is a `mocks` module and a `cfStub` service that provide elaborate mocks
for certain parts of the app. Use of `cfStub` service is *deprecated* and needs
some major cleanup.


UI Acceptance Test
------------------

We provide a small library to write acceptance tests. The library creates
objects that allow you to interact with the DOM and provides assertions

~~~js
import {createView} from 'helpers/DOM'

const view = createView(document.body)
view.find('input-field').setValue('thomas')
view.find('submit-button').click()
view.find('notification').assertText('Hello thomas!')
~~~

Elements are selected using the `data-test-id` property. For API documentation,
see the `test/helpers/DOM` module.

There exists a context helper for testing stateless components. You can find the
documentation in `test/helpers/DOM`.

~~~js
it('tests my component', function () {
  const ui = this.createUI()
  ui.render(h('div', [ ... ]))
  ui.find('my-input').setValue('hello')
})
~~~

This technique is fairly new and requires extending.


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
