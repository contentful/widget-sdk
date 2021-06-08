import { getSnowplowSchema } from 'analytics/SchemasSnowplow';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/SpaceEntityAction
 * @description
 * Exports a function that transforms space entity actions (e.g. entry publish,
 * content type create) to Snowplow format, including the entity as a linked context.
 * Also adds the entity_automation_scope as context if the entity was created by us
 * on the user's behalf. For example, during auto space creation or when a space is
 * created using an example space template.
 */
export default function EntityAction(_eventName, eventData) {
  const contexts = [];

  if (eventData.template) {
    contexts.push(getSpaceTemplateContext(eventData));
  }

  // if the entity is marked as created for the user by us
  // add object matching entity_automation_scope schema
  // to the context as well
  if (eventData.entityAutomationScope) {
    contexts.push({
      schema: getSnowplowSchema('entity_automation_scope').path,
      data: {
        ...getBaseData(eventData),
        scope: eventData.entityAutomationScope.scope,
      },
    });
  }

  (eventData.widgetTrackingContexts || []).forEach((ctx) => contexts.push(ctx));

  return { data: {}, contexts };
}

function getSpaceTemplateContext(eventData) {
  return {
    schema: getSnowplowSchema('space_template').path,
    data: {
      ...getBaseData(eventData),
      name: eventData.template,
    },
  };
}

function getBaseData(eventData) {
  return {
    executing_user_id: eventData.userId,
    organization_id: eventData.organizationId,
    space_id: eventData.spaceId,
  };
}
