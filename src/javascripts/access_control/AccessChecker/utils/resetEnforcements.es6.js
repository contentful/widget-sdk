import { getModule } from 'NgRegistry.es6';

/**
 * Remove all persistent notifications
 */
export default function resetEnforcements() {
  const $rootScope = getModule('$rootScope');

  $rootScope.$broadcast('resetPersistentNotification');
}
