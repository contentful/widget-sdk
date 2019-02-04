import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';
import * as K from 'utils/kefir.es6';
import Welcome from 'app/home/welcome/Welcome.es6';

export default function register() {
  registerDirective('cfWelcome', [
    'services/TokenStore.es6',
    TokenStore => ({
      link: function($scope, el) {
        const host = el[0];
        // if we assign to the $scope, angular will start to track it
        // automatically, which we don't want - we call re-renders manually
        const state = {
          user: null
        };

        // user is always there, so the callback will be invoked immediately
        // so we don't need initial render
        K.onValueScope($scope, TokenStore.user$, user => {
          state.user = user;
          render();
        });

        $scope.$on('$destroy', function() {
          ReactDOM.unmountComponentAtNode(host);
        });

        function render() {
          ReactDOM.render(React.createElement(Welcome, { ...state }), host);
        }
      }
    })
  ]);
}
