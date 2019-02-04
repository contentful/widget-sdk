import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';

export default function register() {
  registerDirective('cfOnboardingWithTea', [
    'app/home/welcome/OnboardingWithTea.es6',
    ({ default: OnboardingWithTea }) => ({
      link: function($scope, el) {
        const root = el[0];

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(root);
        });

        ReactDOM.render(<OnboardingWithTea />, root);
      }
    })
  ]);
}
