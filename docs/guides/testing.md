Testing
=======

This guide describes the testing setup and helpers for the UI.

Tests are written in [Jasmine][jasmine] (version `2.5.x`) and run with
[Karma][karma].  The tests use [Sinon][sinon] to create function stubs.
The tests files are contained in `test/unit` and `test/integration`,
helpers are contained in `test/helpers`.

You can run the tests with
~~~bash
$ gulp prepare-tests
$ npm test # run with watching
$ or:
$ npm run test:once # run only once
~~~

Deprecated Patterns
-------------------

This is a list of patterns used in old code but deprecated.

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

The test module system is configured in
[`test/system-config.js`][src:test/system-config] and set up in
[`test/prelude.js`](../../test/prelude.js)

### Using modules from `src/javascripts`
ES6 modules from the application code in `src/javascripts` can also be loaded
from test files as long all their dependencies are either ES6 modules or
constant Angular modules. For example

~~~js
// test/unit/utils/Kefir.spec.js

import * as KM from 'helpers/mocks/kefir';
// from src/javscripts/utils.kefir.es6.js
import * as K from 'utils/kefir';
~~~

The ES6 module `utils/kefir` imports the `libs/kefir` module, which is registered
in `libs/index.js`. Any NPM module that needs to be available within the testing
context will need to be added to this file in the `window.libs` array.

If you don't use an Angular context in your tests, it's not possible to import
Angular services that are not ES6 modules into your test. To use Angular services
that are not defined as ES6 modules see [“Using Angular”](#using-angular) below.

### Using NPM packages
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
[src:test/system-config]: ../../test/system-config.js


Testing DSL
-----------

We extend Jasmine’s testing DSL with a couple of features. The DSL functions are
defined in `test/helpers/dsl.js`.

To select only a subsect of specs to run, replace their respective
`describe` or `it` calls with `fdescribe` or `fit`.

In the context of a test we make varous helpers available. They are documented
in the [Test module][module:test].

### Async/await

You can use async/await code in your tests, both in setup and in tests itself. They behave the same as generators, feel free to choose what you prefer more.

~~~js
beforeEach(async function () {
  await asyncSetup();
})

it('a test with async/await', async function () {
  const value = await this.resolve('X');
  expect(value).toBe('X');
})
~~~

It supports both native and $q-based promises – for Angular ones it does `$rootScope.$apply()` every 10ms, until it is resolved.

### Generators

You can write asynchronous tests using generator functions.
~~~js
beforeEach(function* () {
  yield asyncSetup();
})

it('a generator test', function* () {
  const value = yield this.resolve('X');
  expect(value).toBe('X');
})
~~~
You must always yield a promise. Inside `it` the function `$rootScope.$apply()`
will be called after each yield and before control is handed back to the
generator. This is not the case for generators passed to `beforeEach` and
`afterEach`.

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

#### Avoiding memory leaks

When using local variables to provide setup data to test cases memory leaks are
introduced. Consider the following test code.
~~~js
describe(function () {
  let foo

  beforeEach(setup)

  function setup () {
    foo = largeObject
  }

  // test cases
})
~~~

The test runner keeps a reference to all test suites during a test run, even
after all the test cases in a suite have run. This means that all the transitive
references of a test suite are never garbage collected. In particular each test
suite contains a reference to its `beforeEach` hooks. In our example this is the
`setup` function. `setup` in turn keeps a reference to `foo`. After running on
test case in that suite we therefore hold a reference to `largeObject` which is
never collected.

To avoid this problem we may either assign `largeObject` to a context property
by using `this.foo = largeObject` or add an `afterEach` hook that sets `foo =
null`.


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

#### Angular

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

#### ES6 Modules

##### Within an Angular Context

The above won't work if you're using an ES6 module:

~~~js
// Foo.es6.js
import * as bar from 'bar';

export function () {
  return bar.buzz();
}
~~~

This is because all ES6 dependencies are shallow-copied, so changes made after
won't be applied later on.

If you're importing within an Angular context, you can generally stub out the
module using `$provide.value` or `$provide.constant`:

```js
let myModule;

beforeEach(function () {
  module('contentful/test', function($provide) {
    $provide.value('utils/to-stub', myStub);
    $provide.constant('utils/different-to-stub', myDifferentStub);
  });

  myModule = this.$inject('utils/myModule').default;
});
```

##### Outside of an Angular Context

However, if you're testing a utility that doesn't need an Angular instance, it is
useful to be able to test without relying on Angular to $provide and $inject. If
you need to stub out an ES6 module within a test, that does not use an Angular
context, you can stub it out by creating an isolated system and stubbing the
necessary modules before importing your module.

```js
import { createIsolatedSystem } from 'test/helpers/system-js';

beforeEach(function* () {
  this.stubs = {
    stub1: sinon.stub(),
    stub2: sinon.stub()
  };

  this.system = createIsolatedSystem();

  this.system.set('utils/to-stub', {
    moduleMethod: stubs.stub1
  });

  this.system.set('utils/different-to-stub', {
    // ... Another stubbed module
  });

  this.myModule = yield system.import('utils/myModule');

  // This works like an ES6 import statement,
  // so be aware of defaults.
});
```

*Note*: If you need to stub something in an integration test, such as a React
component, see [UI Acceptance Test](#ui-acceptance-test) below.

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

### Within an isolated SystemJS context

If you are testing a stateless component within an isolated context, using the `createIsolatedSystem`
helper method, you will need to instantiate `this.createUI` with the `createMountPoint` imported from
your isolated system. If you don't do this, your React components won't test properly and will fail
during instantiation.

```js
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('MyComponent', function () {
  beforeEach(function* () {
    this.system = createIsolatedSystem();

    this.system.set('utils/to-stub', {
      ...
    });

    const { default: createMountPoint } = yield system.import('ui/Framework/DOMRenderer');

    this. ui = this.createUI({
      createMountPoint
    });
  });
});
```


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
[tape]: https://github.com/substack/tape
[require]: https://docs.angularjs.org/api/ng/service/$compile#-require-
