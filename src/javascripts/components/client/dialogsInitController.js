import { getModule } from 'NgRegistry';
import { initActivationEmailResend } from './activationEmailResendController';

/**
 * Takes care of initialization of modal dialog related global, lifelong services.
 * Controlls how certain global dialogs play together to prevent them interfering
 * with eachother.
 */
export function initDialogsController() {
  const spaceContext = getModule('spaceContext');
  const $rootScope = getModule('$rootScope');

  initActivationEmailResend();

  $rootScope.$watch(
    () => spaceContext.getId(),
    (spaceId) => {
      if (spaceId) {
        // Reset notification related to the previous space.
        $rootScope.$broadcast('persistentNotification', null);
      }
    }
  );
}
