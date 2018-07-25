'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', require => {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const Welcome = require('app/home/welcome/Welcome').default;
  const K = require('utils/kefir');
  const TokenStore = require('services/TokenStore');

  return {
    link: function ($scope, el) {
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

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });

      function render () {
        ReactDOM.render(React.createElement(Welcome, {...state}), host);
      }
    }
  };
}]);
