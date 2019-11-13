import { getModule } from 'NgRegistry';

/**
 * Remove all persistent notifications
 */
export default function resetEnforcements() {
  const $rootScope = getModule('$rootScope');

  $rootScope.$broadcast('resetPersistentNotification');
}
