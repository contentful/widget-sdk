import {snakeCase} from 'lodash';
import {track} from 'analytics/Analytics';

export function entityActionSuccess (_entityId, entityData) {
  const eventName = getEventName(entityData.actionData);
  track(eventName, entityData);
}

function getEventName (actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
