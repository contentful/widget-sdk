import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name dialogsInitController
   *
   * @description
   * Takes care of initialization of modal dialog related global, lifelong services.
   * Controlls how certain global dialogs play together to prevent them interfering
   * with eachother.
   */
  registerFactory('dialogsInitController', [
    '$rootScope',
    'spaceContext',
    'activationEmailResendController',
    'subscriptionNotifier',
    ($rootScope, spaceContext, activationEmailResendController, subscriptionNotifier) => {
      return {
        init: init
      };

      function init() {
        activationEmailResendController.init();
        initSpaceWatcher();
      }

      function onSpaceChanged(spaceId) {
        if (!spaceId) {
          return;
        }
        // Reset notification related to the previous space.
        $rootScope.$broadcast('persistentNotification', null);

        subscriptionNotifier.notifyAbout(spaceContext.organization);
      }

      function initSpaceWatcher() {
        $rootScope.$watch(() => spaceContext.getId(), onSpaceChanged);
      }
    }
  ]);
}
