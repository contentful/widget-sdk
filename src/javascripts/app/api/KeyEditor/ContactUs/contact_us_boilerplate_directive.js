angular.module('contentful')
.directive('cfContactUsBoilerplate', ['require', function (require) {
  var LD = require('utils/LaunchDarkly/index');
  var renderTemplate = require('app/api/KeyEditor/ContactUs/template').render;
  var createContactLink = require('services/ContactSales').createContactLink;

  var flagName = 'feature-ps-10-2017-contact-us-boilerplate';
  var flagPromise = LD.onABTestOnce(flagName);

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="contact.component" />',
    controllerAs: 'contact',
    controller: function () {
      var controller = this;
      controller.link = createContactLink('boilerplate');

      render();
      flagPromise.then(function (flag) {
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
        // TODO: add tracking after new schema will be added to the snowplow
        // https://contentful.tpondemand.com/entity/23643
      }
    }
  };
}]);
