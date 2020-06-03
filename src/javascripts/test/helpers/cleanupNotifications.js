/* global jest */

import { Notification } from '@contentful/forma-36-react-components';

export default function cleanupNotifications() {
  if (!global.setTimeout.mock) {
    throw new Error(
      'Call `jest.useFakeTimers()` in the spec file before calling `cleanupNotifications`'
    );
  }

  Notification.closeAll();
  jest.runOnlyPendingTimers();
}
