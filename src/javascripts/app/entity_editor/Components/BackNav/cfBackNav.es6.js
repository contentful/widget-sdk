import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';

export default function register() {
  registerDirective('cfBackNav', [
    'app/entity_editor/Components/BackNav', // { default: BackNav }
    ({ default: BackNav }) => {
      return {
        link: function link($scope, elem) {
          function render(props) {
            ReactDOM.render(<BackNav {...props} />, elem[0]);
          }

          render();

          $scope.$on('$destroy', () => {
            ReactDOM.unmountComponentAtNode(elem[0]);
          });
        }
      };
    }
  ]);
}
