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

  it('should find all NgRegistry import declarations', () => {
    const modules = analyze(
      node,
      `
        import { registerController } from 'NgRegistry.es6';

        registerController('TestController', []);
      `
    );

    expect(modules).toEqual(['NgRegistry']);
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

  it('should find all ServicesConsumer values', () => {
    const modules1 = analyze(
      node,
      `
        const ServicesConsumer = require('../../reactServiceContext').default;

        const WebhookEditor = () => {};

        export default ServicesConsumer('$state', 'notification', 'modalDialog', 'ReloadNotification', {
            as: 'Analytics',
            from: 'analytics/Analytics.es6'
          })(WebhookEditor);
    `
    );

    const modules2 = analyze(
      node,
      `
      const SC = require('../../reactServiceContext').default;

      const WebhookEditor = () => {};

      export default SC('$state', 'notification', 'modalDialog', 'ReloadNotification', {
          as: 'Analytics',
          from: 'analytics/Analytics.es6'
        })(WebhookEditor);
    `
    );

    expect(modules1).toEqual([
      '$state.implicit',
      'notification.implicit',
      'modalDialog.implicit',
      'ReloadNotification.implicit',
      'analytics/Analytics.implicit'
    ]);

    expect(modules2).toEqual([
      '$state.implicit',
      'notification.implicit',
      'modalDialog.implicit',
      'ReloadNotification.implicit',
      'analytics/Analytics.implicit'
    ]);
  });
});
