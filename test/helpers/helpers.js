import _ from 'lodash';
import { awaitInitReady } from 'NgRegistry.es6';

export const $inject = function(serviceName) {
  try {
    let module;

    inject($injector => {
      module = $injector.get(serviceName);
    });

    return module;
    // return this.$injector.get(serviceName);
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
  const { registerController } = await system.import('NgRegistry.es6');

  for (const name of names) {
    registerController(name, function() {});
  }
};

export const $removeDirectives = async function(system, names) {
  const { registerFactory } = await system.import('NgRegistry.es6');

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
