import $document from '$document';
import {h} from 'utils/hyperscript';
import {uniqueId} from 'lodash';

/**
 * Appends an empty dev notifications container to body.
 */
export function init () {
  $document.find('body').append(h('.cf-dev-notifications', [h('a.btn-toggle-collapsed', {href: '#'})]));
  const container = $document.find('.cf-dev-notifications');
  container.find('.btn-toggle-collapsed').on('click', () => { container.toggleClass('is-collapsed'); });
}

/**
 * Adds a notification with title and html body
 * @returns unique id
 */
export function addNotification (title, content) {
  const notificationId = uniqueId();
  const header = h('h5', [title]);
  const notification = h('.cf-dev-notification', {dataNotificationId: notificationId}, [header, content]);
  $document.find('.cf-dev-notifications').show().append(notification);
  return notificationId;
}

/**
 * Removes a notification with given id.
 */
export function removeNotification (notificationId) {
  $document.remove(`.cf-dev-notification[data-notification-id="${notificationId}"]`);
  // TODO hide container
}
