import leaveConfirmator from 'navigation/confirmLeaveEditor';

const detail = {
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
};

export default {
  name: 'extensions',
  url: '/extensions',
  template:
    '<react-component name="app/settings/extensions/routes/ExtensionsListRoute.es6" props="props" />',
  params: {
    // optional extensionUrl param to open GitHubInstaller
    extensionUrl: null
  },
  controller: [
    '$scope',
    '$stateParams',
    ($scope, $stateParams) => {
      $scope.props = {
        extensionUrl: decodeURI($stateParams.extensionUrl || '')
      };
    }
  ],
  children: [detail]
};
