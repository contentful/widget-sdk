import { registerDirective } from 'NgRegistry.es6';

import controller from 'account/NewOrganizationMembership';

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
