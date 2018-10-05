export default {
  name: 'usage',
  url: '/:orgId/usage',
  label: 'Usage',
  template: '<react-component name="account/usage/OrganizationUsage.es6" props="props" />',
  controller: [
    '$stateParams',
    '$scope',
    ($stateParams, $scope) => {
      $scope.props = {
        orgId: $stateParams.orgId,
        onReady: function() {
          $scope.context.ready = true;
          $scope.$applyAsync();
        },
        onForbidden: function() {
          $scope.context.forbidden = true;
        }
      };
    }
  ]
};
