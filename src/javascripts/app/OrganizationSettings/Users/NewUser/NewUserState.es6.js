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
  template: '<cf-new-organization-membership properties="properties" />'
};
