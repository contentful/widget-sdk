import { NotifierAPI } from '@contentful/field-editor-shared';
import { Notification } from '@contentful/forma-36-react-components';

export function createNotifierApi(): NotifierAPI {
  return {
    success: (message: string) => {
      Notification.success(message);
    },
    error: (message: string) => {
      Notification.error(message);
    },
  };
}
