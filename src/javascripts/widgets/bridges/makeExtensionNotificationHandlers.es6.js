import { Notification } from '@contentful/forma-36-react-components';

export default function makeExtensionNotificationHandlers() {
  return async function notify({ type, message }) {
    if (['success', 'error'].includes(type) && typeof message === 'string') {
      Notification[type](message);
    } else {
      throw new Error('Invalid notification type.');
    }
  };
}
