'use strict';

angular.module('contentful')

.directive('cfOnboardingWithTea', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var OnboardingWithTea = require('app/home/welcome/OnboardingWithTea').default;

  return {
    link: function ($scope, el) {
      var root = el[0];

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(root);
      });

      ReactDOM.render(React.createElement(OnboardingWithTea), root);
    }
  };
}]);
