import { getModule } from 'NgRegistry.es6';

/**
 * TODO move from access checker or get rid of it entirely
 */
export default function broadcastEnforcement(enforcement) {
  const $rootScope = getModule('$rootScope');

  if (enforcement) {
    $rootScope.$broadcast('persistentNotification', {
      message: enforcement.message,
      actionMessage: enforcement.actionMessage,
      action: enforcement.action,
      icon: enforcement.icon,
      link: enforcement.link
    });
  }
}
