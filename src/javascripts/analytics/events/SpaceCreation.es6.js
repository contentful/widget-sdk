import {snakeCase, extend, omitBy, isUndefined} from 'lodash';
import {track} from 'analytics/Analytics';

export function entityActionSuccess (_entityId, entityData, templateName) {
  const eventName = getEventName(entityData.actionData);
  track(eventName, omitBy(extend({template: templateName}, entityData), isUndefined));
}

function getEventName (actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
