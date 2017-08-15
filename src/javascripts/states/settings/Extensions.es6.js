import makeState from 'states/base';
import controller from 'app/UiExtensions/Controller';
import template from 'app/UiExtensions/Template';

export default makeState({
  name: 'extensions',
  url: '/extensions',
  template: template(),
  loadingText: 'Loading...',
  controller: ['$scope', function ($scope) {
    controller($scope);
  }]
});
