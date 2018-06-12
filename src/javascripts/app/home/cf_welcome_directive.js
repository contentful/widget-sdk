'use strict';

angular.module('contentful')

.directive('cfWelcome', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Welcome = require('app/home/welcome/Welcome').default;
  var K = require('utils/kefir');
  var TokenStore = require('services/TokenStore');
  // Begin test code: feature-ps-10-2017-contact-us-space-home
  var LD = require('utils/LaunchDarkly');
  var contactUsFlagName = 'feature-ps-10-2017-contact-us-space-home';
  // End test code: feature-ps-10-2017-contact-us-space-home

  return {
    link: function ($scope, el) {
      var host = el[0];
      // if we assign to the $scope, angular will start to track it
      // automatically, which we don't want - we call re-renders manually
      const state = {
        user: null,
        hasContactUs: false
      };

      // user is always there, so the callback will be invoked immediately
      // so we don't need initial render
      K.onValueScope($scope, TokenStore.user$, user => {
        state.user = user;
        render();
      });

      // Begin test code: feature-ps-10-2017-contact-us-space-home
      // we don't wait LD flag's value for initial rendering, for two reasons:
      // 1. We don't overcomplicate rendering logic (we can remove this easily)
      // 2. LD is a 3rd-party service, so it _might_ be slow (and it is not crucial)
      LD.onFeatureFlag($scope, contactUsFlagName, flag => {
        state.hasContactUs = flag;
        render();
      });
      // End test code: feature-ps-10-2017-contact-us-space-home

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(host);
      });

      function render () {
        ReactDOM.render(React.createElement(Welcome, {
          user: state.user,
          hasContactUs: state.hasContactUs
        }), host);
      }
    }
  };
}]);
