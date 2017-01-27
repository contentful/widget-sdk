import {snakeCase} from 'lodash';
import analytics from 'analytics';

export function entityActionSuccess (_entityId, entityData) {
  const eventName = getEventName(entityData.actionData);
  analytics.track(eventName, entityData);
}

function getEventName (actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
