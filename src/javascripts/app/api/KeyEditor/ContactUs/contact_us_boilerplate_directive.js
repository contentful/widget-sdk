angular.module('contentful')
.directive('cfContactUsBoilerplate', ['require', function (require) {
  var LD = require('utils/LaunchDarkly');
  var Intercom = require('intercom');
  var renderTemplate = require('app/api/KeyEditor/ContactUs/template').render;
  var Analytics = require('analytics/Analytics');
  var $state = require('$state');

  var flagName = 'feature-ps-10-2017-contact-us-boilerplate';

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      var controller = this;

      render();

      LD.onFeatureFlag($scope, flagName, function (flag) {
        controller.isVisible = flag;
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
          elementId: 'contact_sales_boilerplate',
          fromState: $state.current.name
        });

        Intercom.open();
      }
    }]
  };
}]);
