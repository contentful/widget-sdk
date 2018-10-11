import leaveConfirmator from 'navigation/confirmLeaveEditor';

export default {
  name: 'extensions',
  url: '/extensions',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      template:
        '<react-component name="app/settings/extensions/routes/ExtensionsListRoute.es6" props="props" />',
      params: {
        // optional extensionUrl param to open GitHubInstaller
        extensionUrl: null,
        referrer: null
      },
      controller: [
        '$scope',
        '$stateParams',
        ($scope, $stateParams) => {
          $scope.props = {
            extensionUrl: decodeURI($stateParams.extensionUrl || ''),
            extensionUrlReferrer: $stateParams.referrer || null
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:extensionId',
      template:
        '<react-component name="app/settings/extensions/routes/ExtensionEditorRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        ($scope, $stateParams) => {
          $scope.props = {
            extensionId: $stateParams.extensionId,
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            }
          };
        }
      ]
    }
  ]
};
