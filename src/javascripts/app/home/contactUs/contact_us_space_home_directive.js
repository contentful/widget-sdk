angular.module('contentful')
.directive('cfContactUsSpaceHome', ['require', function (require) {
  var LD = require('utils/LaunchDarkly');
  var renderTemplate = require('app/home/contactUs/template').render;
  var createContactLink = require('services/ContactSales').createContactLink;

  var flagName = 'feature-ps-10-2017-contact-us-space-home';

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: ['$scope', function ($scope) {
      var controller = this;
      controller.link = createContactLink('spacehome');

      render();
      LD.onABTest($scope, flagName, function (flag) {
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
        // TODO: add tracking
      }
    }]
  };
}]);
