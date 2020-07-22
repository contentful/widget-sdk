import { Notification } from '@contentful/forma-36-react-components';

interface NotifyPayload {
  type: 'success' | 'error';
  message: string;
}

export const makeNotifyHandler = () => {
  return async function ({ type, message }: NotifyPayload) {
    if (['success', 'error'].includes(type) && typeof message === 'string') {
      Notification[type](message);
    } else {
      throw new Error('Invalid notification type.');
    }
  };
};
