angular.module('contentful')
.directive('cfContactUsSpaceHome', ['require', require => {
  const LD = require('utils/LaunchDarkly');
  const Intercom = require('intercom');
  const renderTemplate = require('app/home/contactUs/template').render;
  const Analytics = require('analytics/Analytics');
  const $state = require('$state');

  const flagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      const controller = this;

      render();
      LD.onFeatureFlag($scope, flagName, flag => {
        controller.isVisible = Intercom.isEnabled() && flag;
        render();
      });

      function render () {
        controller.component = renderTemplate({
          isVisible: controller.isVisible,
          onClick: onClick
        });
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
