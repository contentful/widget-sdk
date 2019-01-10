Testing with Karma
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

* `this.$inject()` for ES6 modules. Use an isolated SystemJS instance.
* Using the `$compile` service to compile directives. Use `this.$compile()`
  instead.
* Global `sinon`. Use `import sinon from 'helpers/sinon'` instead.


Module System
-------------

Test files are only executed when their file name ends with `.spec.js`.

All files in the `test/` folder are treated as ES6 modules. Files in the
`test/helpers/` directory can by imported with `import 'test/helpers/my-helper'`.

The test module system is configured in
[`test/system-config.js`][src:test/system-config] and set up in
[`test/prelude.js`](../../test/prelude.js)

### Using modules from `src/javascripts`
ES6 modules from the application code in `src/javascripts` can also be loaded
from test files as long all their dependencies are either ES6 modules. For example

~~~js
// test/unit/utils/Kefir.spec.js

import * as KM from 'test/helpers/mocks/kefir';
// from src/javscripts/utils.kefir.es6.js
import * as K from 'utils/kefir';
~~~

The ES6 module `utils/kefir` imports the `kefir` module, which is registered
in `libs/env-prod.js`. Any NPM module that needs to be available within the testing
context only will need to be added to `libs/env-test.js`.

If you don't use an Angular context in your tests, it's not possible to import
Angular services that are not ES6 modules into your test. To use Angular services
that are not defined as ES6 modules see [“Using Angular”](#using-angular) below.

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

### Generators (deprecated)

You can write asynchronous tests using generator functions. This pattern is deprecated as using `async/await` should cover the use case for waiting for asynchronous code.

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

### Testing an Angular module

To test an Angular module, you must load the module via `module('contentful/test')`.

~~~js
beforeEach(function () {
  module('contentful/test');
  const myDirective = this.$inject('directives/myDirective');
})
~~~

### Testing directives

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

### Testing a non-Angular module

If you are testing a non-Angular module, you should create an isolated SystemJS context
and import it using `system.import`.

~~~js
import createIsolatedSystem from 'test/helpers/system-js';

beforeEach(async function() {
  const system = createIsolatedSystem();
  const myModule = await system.import('app/myModule.es6');
})

~~~


Mocks and Stubs
---------------

Use `sinon.stub()` to create mock functions and `sinon.assert` to make
assertions. We provide a couple of extensions to Sinon stubs.

### Promises

The `stub.resolves(value)` method makes a stub return a resolved promise,
using Angular's `$q`.

~~~js
// Equivalent
sinon.stub().resolves('yeah')
sinon.stub().returns($q.resolve('yeah'))
~~~

The `stub.rejects(error)` method makes a stub return a rejected promise.

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

It is recommended to stub exactly what you need for your test.

However, if you need to stub a dependency's property while keeping the
other properties intact, you need to import the module first, overwrite
the specific property, and then rewrite the import.

#### Angular

The method to mock a dependency depends on if the dependency is either Angular
or non-Angular.

##### Angular dependency

You can provide it via `$provide.constant` when initially defining `module('contentful/test')`.

~~~js
module('contentful/test', $provide => {
  $provide.constant('myFactory', {
    // ...
  })
})
~~~

If you need to stub just a specific property while keeping the rest of the dependency intact,
you will need to first determine the kind of module you're mocking, e.g. a factory, directive,
or controller, import the original module, mock the specific property, and rewrite the module
using the registration function from `NgRegistry.es6`.

~~~js
module('contentful/test');

const { registerFactory } = this.$inject('NgRegistry.es6');
const originalMyFactory = this.$inject('myFactory');
originalMyFactory.property = {};
registerFactory('myFactory', () => originalMyFactory);

~~~

*NOTE*: You must provide a function when registering anything other than a constant. If you provide an
object directly, Angular will error.

##### ES6 dependency

You should provide it via an isolated SystemJS instance before instantiating Angular.

~~~js
const system = createIsolatedSystem();

/*
 As above, import if necessary to overwrite just a property

 const myModule = await system.import('app/myModule.es6');
 myModule.property = {};
*/

system.set('app/myModule.es6', myModule);

module('contentful/test');

const myFactory = this.$inject('myFactory');
~~~

#### ES6 Modules

##### ES6 dependency

You can directly stub out the module in the isolated SystemJS instance.

~~~js
const system = createIsolatedSystem();

system.set('utils/AwesomeUtils.es6', {
  coolFunc: sinon.stub();
})

const myModule = await system.import('app/myModule.es6');
~~~

To mock a single module property, import it and overwrite it.

~~~js
const system = createIsolatedSystem();

const AwesomeUtils = await system.import('utils/AwesomeUtils.es6');
AwesomeUtils.coolFunc = sinon.stub();

system.set('utils/AwesomeUtils.es6', AwesomeUtils);

const myModule = await system.import('app/myModule.es6');
~~~


##### Angular dependency

All ES6 modules import their Angular dependencies via `getModule`.

To stub an Angular dependency, you can mock it by mocking `getModule` with a Sinon
stub and mocking the given argument.

~~~js
const system = createIsolatedSystem();

const getModuleStub = sinon.stub();
getModuleStub
  .withArgs('myFactory')
  .returns({
    // ...
  })

system.set('NgRegistry.es6', {
  getModule: getModuleStub
});

await system.import(...);
~~~

If you need to mock a single module property, you will need to instantiate Angular first,
inject it, then mock it via `getModule`.

~~~js
module('contentful/test');

const myFactory = this.$inject('myFactory');
myFactory.property = {};

const system = createIsolatedSystem();

const getModuleStub = sinon.stub();
getModuleStub
  .withArgs('myFactory')
  .returns(myFactory)

system.set('NgRegistry.es6', {
  getModule: getModuleStub
});

await system.import(...);
~~~

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

*NOTE*: If you are looking to test a React component, you should generally test it via Jest.
See [testing-jest-doc] for more information.

However, if you are testing a component that is rendered using `DOMRenderer#createMountPoint`, you
will need to instantiate `this.createUI` with the `createMountPoint` imported from your isolated
system. If you don't do this, your React components won't test properly and will fail during instantiation.

~~~js
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
[tape]: https://github.com/substack/tape
[require]: https://docs.angularjs.org/api/ng/service/$compile#-require-
[testing-jest-doc]: ./testing-jest.md
