'use strict';

angular
  .module('contentful')

  .directive('cfOnboardingWithTea', [
    'require',
    require => {
      const React = require('react');
      const ReactDOM = require('react-dom');
      const OnboardingWithTea = require('app/home/welcome/OnboardingWithTea').default;

      return {
        link: function($scope, el) {
          const root = el[0];

          $scope.$on('$destroy', () => {
            ReactDOM.unmountComponentAtNode(root);
          });

          ReactDOM.render(React.createElement(OnboardingWithTea), root);
        }
      };
    }
  ]);
