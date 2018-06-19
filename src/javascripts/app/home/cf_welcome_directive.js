'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Welcome = require('app/home/welcome/Welcome').default;
  var K = require('utils/kefir');
  var TokenStore = require('services/TokenStore');

  return {
    link: function ($scope, el) {
      var host = el[0];
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
