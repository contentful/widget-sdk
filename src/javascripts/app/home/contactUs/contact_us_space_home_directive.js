angular.module('contentful').directive('cfContactUsSpaceHome', [
  'require',
  require => {
    const LD = require('utils/LaunchDarkly');
    const Intercom = require('intercom');
    const Analytics = require('analytics/Analytics.es6');
    const $state = require('$state');

    const flagName = 'feature-ps-10-2017-contact-us-space-home';

    return {
      restrict: 'E',
      template: '<react-component name="app/home/contactUs/Template.es6" props="contact.props"/>',
      controllerAs: 'contact',
      controller: [
        '$scope',
        function($scope) {
          const controller = this;

          controller.props = { onClick };

          LD.onFeatureFlag($scope, flagName, flag => {
            controller.props.isVisible = Intercom.isEnabled() && flag;
          });

          function onClick() {
            Analytics.track('element:click', {
              elementId: 'contact_sales_spacehome',
              groupId: 'contact_sales',
              fromState: $state.current.name
            });

            Intercom.open();
          }
        }
      ]
    };
  }
]);
