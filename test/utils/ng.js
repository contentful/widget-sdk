import _ from 'lodash';
import { awaitInitReady } from 'core/NgRegistry';

function raw$inject(serviceName) {
  let ngModule;

  inject(($injector) => {
    ngModule = $injector.get(serviceName);
  });

  return ngModule;
}

export const $inject = function (serviceName) {
  /*
    This checks to see if the `$injector` has been instantiated
    on the `this` context (in `angular-mocks`, it is known as `$currentSpec`)
    and if not, warn that something is being requested before running
    `$initialize`.

    This warning brings visibility into potential Angular injections that
    occur before calling `$initialize`, which calls `module('contentful/test, ...)`,
    as this may cause issues for `angular-mocks`.
   */
  if (!window.$$currentSpec || !window.$$currentSpec.$injector) {
    const e = new Error(`Injecting ${serviceName} before $initialize`);
    // eslint-disable-next-line
    console.warn(e);
  }

  try {
    return raw$inject(serviceName);
  } catch (e) {
    // eslint-disable-next-line
    console.error(`Couldn't inject ${serviceName}`);
    throw e;
  }
};

export const $compile = function (template, scopeProperties, controllers) {
  const $compile = $inject('$compile');
  const $rootScope = $inject('$rootScope');
  const scope = _.extend($rootScope.$new(true), scopeProperties);
  let transcludeControllers = {};

  if (controllers) {
    // convert controllers to a form `$compile` understands
    transcludeControllers = _.mapValues(controllers, (controllerInstance) => ({
      instance: controllerInstance,
    }));
  }

  const element = $compile(template)(scope, undefined, {
    transcludeControllers: transcludeControllers,
  });

  element.appendTo('body');

  scope.$digest();
  return element;
};

export const $compileWith = function (template, initScope) {
  const $compile = $inject('$compile');
  const $rootScope = $inject('$rootScope');
  const $scope = $rootScope.$new(true);
  if (initScope) {
    initScope($scope);
  }

  const element = $compile(template)($scope);

  $scope.$digest();
  return element;
};

export const $apply = function () {
  const $rootScope = $inject('$rootScope');

  $rootScope.$apply();
};

export const $applyAsync = async function () {
  $apply();

  return new Promise((resolve) => setTimeout(resolve, 10));
};

export const $wait = async function () {
  return new Promise((resolve) => setTimeout(resolve));
};

export const $initialize = async function (system, mock = () => {}) {
  const { angularInitRun } = await system.import('AngularInit');

  delete angular.module('contentful/init')._runBlocks[0];
  angular.module('contentful/init').run(angularInitRun);

  module('contentful/test', mock);

  raw$inject('$location');

  return awaitInitReady();
};

export const $removeControllers = async function (system, names) {
  const { registerController } = await system.import('core/NgRegistry');

  for (const name of names) {
    registerController(name, function () {});
  }
};

export const $removeDirectives = async function (system, names) {
  const { registerFactory } = await system.import('core/NgRegistry');

  for (const name of names) {
    registerFactory(`${name}Directive`, () => []);
  }
};

export const $waitForControllerLoaded = async function ($scope) {
  if ($scope.loaded) {
    return true;
  }

  await $wait();

  $apply();

  return $waitForControllerLoaded($scope);
};

// Waits for a promise by calling apply, until the promise resolves
export const $waitFor = (promise) => {
  const timer = setInterval($apply, 10);
  promise.finally(() => clearInterval(timer));

  return promise;
};

/**
 * This function acts as an adapter for angular’s $q service.
 *
 * It uses the `$q` instance from the current test cases angular
 * injector. This means you need to $initialize() first.
 *
 * This allows application ES6 modules that import `$q` to be imported
 * as ES6 modules in tests.
 *
 * ~~~js
 * import { $q, $initialize } from 'test/utils/ng'
 * import * as C from ' utils/Concurent'
 *
 * describe(function () {
 *   beforeEach(async function () {
 *     await $initialize();
 *   })
 *
 *   it('works', function () {
 *     $q.resolve()
 *     // ...
 *   })
 * })
 * ~~~
 */

export const $q = (...args) => {
  return get$q()(...args);
};

$q.resolve = wrap$q('resolve');
$q.reject = wrap$q('reject');
$q.defer = wrap$q('defer');
$q.all = wrap$q('all');

function wrap$q(method) {
  return (...args) => get$q()[method](...args);
}

function get$q() {
  const $q = $inject('$q');

  if (!$q) {
    // eslint-disable-next-line
    console.warn('$q called in non-Angular context. A promise is leaky.');

    return Promise;
  }

  return $q;
}
