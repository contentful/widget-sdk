import accessChecker from 'access_control/AccessChecker';

export default {
  name: 'usage',
  url: '/usage',
  template: '<cf-space-usage />',
  controller: ['$scope', '$stateParams', '$state', function ($state) {
    const hasAccess = accessChecker.can('update', 'settings');
    if (!hasAccess) {
      $state.go('spaces.detail');
    }
  }]
};
