import makeState from 'states/Base';
import extensions from 'app/Extensions/Extensions';

const detail = {
  name: 'detail',
  url: '/:extensionId',
  template: '<cf-extension-editor />',
  resolve: {
    extension: ['spaceContext', '$stateParams', (spaceContext, $stateParams) => spaceContext.cma.getExtension($stateParams.extensionId)]
  },
  controller: ['$scope', 'extension', ($scope, extension) => {
    $scope.extension = extension;
  }]
};

export default makeState({
  name: 'extensions',
  url: '/extensions',
  template: '<cf-component-bridge component="component" />',
  loadingText: 'Loading Extensions…',
  controller: ['$scope', extensions],
  children: [detail]
});
