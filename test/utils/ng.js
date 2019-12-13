import _ from 'lodash';
import { awaitInitReady } from 'NgRegistry';

export const $inject = function(serviceName) {
  try {
    let module;

    inject($injector => {
      module = $injector.get(serviceName);
    });

    return module;
  } catch (e) {
    // eslint-disable-next-line
    console.error(`Couldn't inject ${serviceName}`);
    throw e;
  }
};

export const $compile = function(template, scopeProperties, controllers) {
  const $compile = $inject('$compile');
  const $rootScope = $inject('$rootScope');
  const scope = _.extend($rootScope.$new(true), scopeProperties);
  let transcludeControllers = {};

  if (controllers) {
    // convert controllers to a form `$compile` understands
    transcludeControllers = _.mapValues(controllers, controllerInstance => ({
      instance: controllerInstance
    }));
  }

  const element = $compile(template)(scope, undefined, {
    transcludeControllers: transcludeControllers
  });

  element.appendTo('body');

  scope.$digest();
  return element;
};

export const $compileWith = function(template, initScope) {
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

export const $apply = function() {
  const $rootScope = $inject('$rootScope');

  $rootScope.$apply();
};

export const $applyAsync = async function() {
  $apply();

  return new Promise(resolve => setTimeout(resolve, 10));
};

export const $wait = async function() {
  return new Promise(resolve => setTimeout(resolve));
};

export const $flush = function() {
  const $http = $inject('$httpBackend');
  const $timeout = $inject('$timeout');

  // We need to run this multiple times because flushing an HTTP
  // response might change something that requires another apply.
  _.times(3, () => {
    $apply();
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

export const $initialize = async function(system, mock = () => {}) {
  const { angularInitRun } = await system.import('AngularInit');
  delete angular.module('contentful/init')._runBlocks[0];
  angular.module('contentful/init').run(angularInitRun);

  module('contentful/test', mock);

  $inject('$location');

  return awaitInitReady();
};

export const $removeControllers = async function(system, names) {
  const { registerController } = await system.import('NgRegistry');

  for (const name of names) {
    registerController(name, function() {});
  }
};

export const $removeDirectives = async function(system, names) {
  const { registerFactory } = await system.import('NgRegistry');

  for (const name of names) {
    registerFactory(`${name}Directive`, () => []);
  }
};

export const $waitForControllerLoaded = async function($scope) {
  if ($scope.loaded) {
    return true;
  }

  await $wait();

  $apply();

  return $waitForControllerLoaded($scope);
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
