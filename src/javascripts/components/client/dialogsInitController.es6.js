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
    ($rootScope, spaceContext, activationEmailResendController) => {
      return { init };

      function init() {
        activationEmailResendController.init();

        $rootScope.$watch(
          () => spaceContext.getId(),
          spaceId => {
            if (spaceId) {
              // Reset notification related to the previous space.
              $rootScope.$broadcast('persistentNotification', null);
            }
          }
        );
      }
    }
  ]);
}
