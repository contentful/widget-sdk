import { NotifierAPI } from 'contentful-ui-extensions-sdk';

interface NotifyPayload {
  type: 'success' | 'error';
  message: string;
}

export const makeNotifyHandler = (notifierAPI: NotifierAPI) => {
  return async function ({ type, message }: NotifyPayload) {
    switch (type) {
      case 'error':
        return notifierAPI.error(message);
      case 'success':
        return notifierAPI.success(message);
      default:
        throw new RangeError(`Unknown notification type ${type}`);
    }
  };
};
