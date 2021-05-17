import { getSpaceContext } from 'classes/spaceContext';
import { track } from 'analytics/Analytics';
import { captureError } from 'core/monitoring';

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
  const spaceContext = getSpaceContext();
  return ({ data }) => {
    try {
      const event = `entry:${action}`; // entry:create, entry:publish
      const contentTypeId = data.sys.contentType.sys.id;
      const contentType = spaceContext.publishedCTs.get(contentTypeId);
      track(event, {
        eventOrigin: origin,
        contentType,
        response: data,
      });
    } catch (error) {
      captureError(error);
    }
  };
}
