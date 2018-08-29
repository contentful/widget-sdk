import { snakeCase, omitBy, isUndefined, includes } from 'lodash';
import { track } from 'analytics/Analytics';

const EVENTS_TO_SEND = ['content_type:create', 'entry:create', 'asset:create', 'api_key:create'];
const EVENTS_WITH_ORIGIN_FIELD = ['entry:create'];
const TEMPLATED_CREATION_EVENT_ORIGIN = 'example-space-creation';
const EMPTY_CREATION_EVENT_ORIGIN = 'space-creation';

export function entityActionSuccess(_entityId, entityData, templateName) {
  const eventName = getEventName(entityData.actionData);

  if (includes(EVENTS_TO_SEND, eventName)) {
    const data = { template: templateName };
    if (includes(EVENTS_WITH_ORIGIN_FIELD, eventName)) {
      data.eventOrigin = templateName
        ? TEMPLATED_CREATION_EVENT_ORIGIN
        : EMPTY_CREATION_EVENT_ORIGIN;
    }
    track(eventName, omitBy({ ...data, ...entityData }, isUndefined));
  }
}

function getEventName(actionData) {
  return `${snakeCase(actionData.entity)}:${actionData.action}`;
}
