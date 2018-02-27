'use strict';

angular.module('contentful')

.directive('cfOnboardingWithTea', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var OnboardingWithTea = require('app/home/welcome/OnboardingWithTea').default;
  var spaceContext = require('spaceContext');
  // var LD = require('utils/LaunchDarkly');
  // var contactUsFlagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    link: function ($scope, el) {
      var root = el[0];
      var orgId = spaceContext.space.getOrganizationId();

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(root);
      });

      ReactDOM.render(React.createElement(OnboardingWithTea, { orgId: orgId }), root);
    }
  };
}]);
