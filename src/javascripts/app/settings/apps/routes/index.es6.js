export default {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      template:
        '<react-component name="app/settings/apps/routes/AppsListRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        ($scope, $stateParams) => {
          $scope.props = {
            spaceId: $stateParams.spaceId
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      template: '<react-component name="app/settings/apps/routes/AppRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        ($scope, $stateParams) => {
          $scope.props = {
            appId: $stateParams.appId,
            spaceId: $stateParams.spaceId
          };
        }
      ]
    }
  ]
};
