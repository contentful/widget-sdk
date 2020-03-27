/* global expect, it, describe */

const analyze = require('./analyzers');

describe('analyze', () => {
  const node = {
    extension: '.js',
  };

  it('should find dependencies imported via getModule', () => {
    const modules = analyze(
      node,
      `
        import { getModule, getModules, registerController, registerValue } from 'NgRegistry';
        const $state = getModule('$state');
        const $timeout = getModule('$timeout');
        const SpaceMembershipRepository = getModule('access_control/SpaceMembershipRepository');


        registerController('controllerWithNoDeps', [function() {

        }]);

        registerController('controllerWithDeps', [
          '$scope',
          'spaceContext',
          'access_control/AccessChecker',
          'services/TokenStore',
          function() {}
        ]);

    `
    );

    expect(modules).toEqual([
      'NgRegistry',
      '$state',
      'angular.getModule',
      '$timeout',
      'access_control/SpaceMembershipRepository',
      'angular.controller',
      '$scope',
      'spaceContext',
      'access_control/AccessChecker',
      'services/TokenStore',
    ]);
  });
});
