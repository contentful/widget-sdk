import {snakeCase, extend, omitBy, isUndefined, includes} from 'lodash';
import {track} from 'analytics/Analytics';

export function entityActionSuccess (_entityId, entityData, templateName) {
  const eventName = getEventName(entityData.actionData);
  const eventsToSend = [
    'content_type:create',
    'entry:create',
    'asset:create',
    'api_key:create'
  ];

  if (includes(eventsToSend, eventName)) {
    track(eventName, omitBy(extend({template: templateName}, entityData), isUndefined));
  }
}

function getEventName (actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
