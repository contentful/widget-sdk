import { getModule } from 'NgRegistry';
import { track } from 'analytics/Analytics';
import { logError } from 'services/logger';

export function onEntryEvent(actionName, { succeeded }) {
  switch (actionName) {
    case 'publish':
      succeeded.forEach(entryEventTracker(actionName, 'content-list'));
      break;
    case 'duplicate':
      succeeded.forEach(entryEventTracker('create', 'content-list__duplicate'));
      break;
    default:
      break;
  }
}

function entryEventTracker(action, origin) {
  const spaceContext = getModule('spaceContext');
  return ({ data }) => {
    try {
      const event = `entry:${action}`; // entry:create, entry:publish
      const contentTypeId = data.sys.contentType.sys.id;
      const contentType = spaceContext.publishedCTs.get(contentTypeId).data;
      track(event, {
        eventOrigin: origin,
        contentType,
        response: data,
      });
    } catch (error) {
      logError('Unexpected error during entryEventTracker call', {
        err: error,
        msg: error.message,
      });
    }
  };
}
