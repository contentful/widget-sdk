import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfNewOrganizationMembership', [
  'account/NewOrganizationMembership.es6',
  ({ default: controller }) => ({
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  })
]);
