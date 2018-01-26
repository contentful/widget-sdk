import {snakeCase, extend, omitBy, isUndefined, includes} from 'lodash';
import {track} from 'analytics/Analytics';

const EVENTS_TO_SEND = [
  'content_type:create',
  'entry:create',
  'asset:create',
  'api_key:create'
];

export function entityActionSuccess (_entityId, entityData, templateName) {
  const eventName = getEventName(entityData.actionData);

  if (includes(EVENTS_TO_SEND, eventName)) {
    const data = { template: templateName };
    track(eventName, omitBy(extend(data, entityData), isUndefined));
  }
}

function getEventName (actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
