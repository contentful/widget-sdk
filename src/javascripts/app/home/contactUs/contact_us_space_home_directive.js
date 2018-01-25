angular.module('contentful')
.directive('cfContactUsSpaceHome', ['require', function (require) {
  var LD = require('utils/LaunchDarkly');
  var Intercom = require('intercom');
  var renderTemplate = require('app/home/contactUs/template').render;
  var Analytics = require('analytics/Analytics');
  var $state = require('$state');

  var flagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      var controller = this;

      render();
      LD.onFeatureFlag($scope, flagName, function (flag) {
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
