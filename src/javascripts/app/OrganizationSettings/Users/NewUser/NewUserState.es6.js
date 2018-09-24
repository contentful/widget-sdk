import { h } from 'utils/legacy-html-hyperscript';

export default {
  label: 'Organizations & Billing',
  name: 'new',
  title: 'Organization users',
  url: '/new',
  controller: [
    '$stateParams',
    '$scope',
    ($stateParams, $scope) => {
      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }
  ],
  template: h('cf-new-organization-membership', { properties: 'properties' })
};
