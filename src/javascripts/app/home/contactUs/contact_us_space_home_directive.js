angular.module('contentful')
.directive('cfContactUsSpaceHome', ['require', require => {
  const LD = require('utils/LaunchDarkly');
  const Intercom = require('intercom');
  const Analytics = require('analytics/Analytics');
  const $state = require('$state');

  const flagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    restrict: 'E',
    template: '<react-component name="app/home/contactUs/Template" props="contact.props"/>',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      const controller = this;

      render();
      LD.onFeatureFlag($scope, flagName, flag => {
        render(Intercom.isEnabled() && flag);
      });

      function render (isVisible = false) {
        controller.props = {
          isVisible,
          onClick
        };
      }

      function onClick () {
        Analytics.track('element:click', {
          elementId: 'contact_sales_spacehome',
          groupId: 'contact_sales',
          fromState: $state.current.name
        });

        Intercom.open();
      }
    }]
  };
}]);
