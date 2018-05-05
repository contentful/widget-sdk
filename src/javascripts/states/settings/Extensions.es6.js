import makeState from 'states/Base';
import extensions from 'app/Extensions/Extensions';

const detail = makeState({
  name: 'detail',
  url: '/:extensionId',
  template: '<cf-extension-editor />',
  loadingText: 'Loading Extension…',
  resolve: {
    extension: ['spaceContext', '$stateParams', function (spaceContext, $stateParams) {
      return spaceContext.endpoint({
        method: 'GET',
        path: ['extensions', $stateParams.extensionId]
      });
    }]
  },
  controller: ['$scope', 'extension', function ($scope, extension) {
    $scope.extension = extension;
  }]
});

export default makeState({
  name: 'extensions',
  url: '/extensions',
  template: '<cf-component-bridge component="component" />',
  loadingText: 'Loading Extensions…',
  controller: ['$scope', extensions],
  children: [detail]
});
