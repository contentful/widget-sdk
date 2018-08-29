import { can } from 'access_control/AccessChecker';

export default {
  name: 'usage',
  url: '/usage',
  template: '<cf-space-usage />',
  controller: [
    '$state',
    $state => {
      const hasAccess = can('update', 'settings');
      if (!hasAccess) {
        $state.go('spaces.detail');
      }
    }
  ]
};
