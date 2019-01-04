/* global expect, it, describe */

const analyze = require('./analyzers');

describe('analyze', () => {
  const node = {
    extension: '.js'
  };

  it('should find all angular[fn]', () => {
    const modules = analyze(
      node,
      `
    const _ = {};
    angular
        .module('contentful')
        .directive('cfNewOrganizationMembership', ['require', require => {
            const controller = () => {};
            const service = () => {};
            service();
            _.value();
            _.constant();
            return {
                template: '<cf-component-bridge component="component">',
                scope: {
                    properties: '='
                },
                controller: ['$scope', controller]
            };
        }])
        .factory('someAngularFactory', [() => {}])
        .config('someConfig')
    `
    );

    expect(modules).toEqual([
      'angular.module',
      'angular.directive',
      'angular.factory',
      'angular.config'
    ]);
  });

  it('should find all angular[fn]', () => {
    const modules = analyze(
      node,
      `
        module('contentful/test', $provide => {
          $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
        });

        angular.controller('someController', () => {});
        angular.service('someService', ['$scope', () => {}]);
    `
    );

    expect(modules).toEqual(['angular.controller', 'angular.service']);
  });

  it('should find dependencies imported via getModule', () => {
    const modules = analyze(
      node,
      `
        import { getModule, getModules, registerController, registerValue } from 'NgRegistry.es6';
        const $state = getModule('$state');
        const $timeout = getModule('$timeout');
        const SpaceMembershipRepository = getModule('access_control/SpaceMembershipRepository.es6');
        const [$q, $window] = getModules('$q', '$window', '$state');


        registerController('controllerWithNoDeps', [() => {

        }]);

        registerController('controllerWithDeps', [
          '$scope',
          'spaceContext',
          'access_control/AccessChecker',
          'services/TokenStore.es6',
          () => {}
        ]);

    `
    );

    expect(modules).toEqual([
      'NgRegistry',
      '$state',
      '$timeout',
      'access_control/SpaceMembershipRepository',
      '$q',
      '$window',
      'angular.controller',
      '$scope',
      'spaceContext',
      'access_control/AccessChecker',
      'services/TokenStore'
    ]);
  });
});
