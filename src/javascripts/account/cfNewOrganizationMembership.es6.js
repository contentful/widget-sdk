import { registerDirective } from 'NgRegistry.es6';

import controller from 'account/NewOrganizationMembership.es6';

export default function register() {
  registerDirective('cfNewOrganizationMembership', [
    () => ({
      template: '<cf-component-bridge component="component">',

      scope: {
        properties: '='
      },

      controller: ['$scope', controller]
    })
  ]);
}
