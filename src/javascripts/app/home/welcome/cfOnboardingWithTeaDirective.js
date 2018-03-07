'use strict';

angular.module('contentful')

.directive('cfOnboardingWithTea', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var OnboardingWithTea = require('app/home/welcome/OnboardingWithTea').default;

  return {
    link: function ($scope, el) {
      var root = el[0];

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(root);
      });

      ReactDOM.render(React.createElement(OnboardingWithTea), root);
    }
  };
}]);
