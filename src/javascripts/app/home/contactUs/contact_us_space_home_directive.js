angular.module('contentful')
.directive('cfContactUsSpaceHome', ['require', function (require) {
  var LD = require('utils/LaunchDarkly');
  var renderTemplate = require('app/home/contactUs/template').render;
  var createContactLink = require('services/ContactSales').createContactLink;
  var Analytics = require('analytics/Analytics');
  var $state = require('$state');

  var flagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      var controller = this;
      controller.link = createContactLink('spacehome');

      render();
      LD.onFeatureFlag($scope, flagName, function (flag) {
        controller.isVisible = flag;
        render();
      });

      function render () {
        controller.component = renderTemplate({
          isVisible: controller.isVisible,
          link: controller.link,
          onClick: onClick
        });
      }

      function onClick () {
        Analytics.track('element:click', {
          elementId: 'contact_sales',
          fromState: $state.current.name
        });
      }
    }]
  };
}]);
