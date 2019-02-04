import { registerDirective } from 'NgRegistry.es6';
import { CONTACT_US_SPACE_HOME } from 'featureFlags.es6';

export default function register() {
  registerDirective('cfContactUsSpaceHome', [
    '$state',
    'intercom',
    'utils/LaunchDarkly/index.es6',
    'analytics/Analytics.es6',
    ($state, Intercom, LD, Analytics) => ({
      restrict: 'E',
      template: '<react-component name="app/home/contactUs/Template.es6" props="contact.props"/>',
      controllerAs: 'contact',
      controller: [
        '$scope',
        function($scope) {
          const controller = this;

          controller.props = { onClick };

          LD.onFeatureFlag($scope, CONTACT_US_SPACE_HOME, flag => {
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
    })
  ]);
}
