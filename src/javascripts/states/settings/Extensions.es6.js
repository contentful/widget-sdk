import makeState from 'states/Base';
import extensions from 'app/Extensions/Extensions';

export default makeState({
  name: 'extensions',
  url: '/extensions',
  template: '<cf-component-bridge component="component" />',
  loadingText: 'Loading Extensions...',
  controller: ['$scope', function ($scope) {
    extensions($scope);
  }]
});
