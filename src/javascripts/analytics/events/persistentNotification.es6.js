import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  registerFactory('analyticsEvents/persistentNotification', [
    'analytics/Analytics.es6',
    Analytics => {
      return { action };

      function action(name) {
        const currentPlan = Analytics.getSessionData('organization.subscriptionPlan.name');

        Analytics.track('notification:action_performed', {
          action: name,
          currentPlan: currentPlan !== undefined ? currentPlan : null
        });
      }
    }
  ]);
}
