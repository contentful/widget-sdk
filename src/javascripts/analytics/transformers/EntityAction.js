import { get, extend, snakeCase } from 'lodash';
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
export default function (_eventName, eventData) {
  const contexts = [getEntityContext(eventData)];

  if (eventData.template) {
    contexts.push(getSpaceTemplateContext(eventData));
  }

  // if the entity is marked as created for the user by us
  // add object matching entity_automation_scope schema
  // to the context as well
  if (eventData.entityAutomationScope) {
    contexts.push({
      schema: getSnowplowSchema('entity_automation_scope').path,
      data: extend({ scope: eventData.entityAutomationScope.scope }, getBaseData(eventData)),
    });
  }

  (eventData.widgetTrackingContexts || []).forEach((ctx) => contexts.push(ctx));

  return { data: {}, contexts };
}

function getSpaceTemplateContext(eventData) {
  return {
    schema: getSnowplowSchema('space_template').path,
    data: Object.assign({ name: eventData.template }, getBaseData(eventData)),
  };
}

function getEntityContext(eventData) {
  const schema = getSnowplowSchema(snakeCase(eventData.actionData.entity));
  return {
    schema: schema.path,
    data: Object.assign(
      getBaseEntityData(eventData),
      getEntitySpecificData(schema.name, eventData)
    ),
  };
}

function getBaseEntityData(eventData) {
  return Object.assign(
    {
      action: eventData.actionData.action,
      version: eventData.response.sys.version,
    },
    getBaseData(eventData)
  );
}

function getEntitySpecificData(schemaName, eventData) {
  const data = {};
  data[`${schemaName}_id`] = get(eventData, 'response.sys.id');
  // We track 2 additional fields on entries compared to all other entities
  if (eventData.actionData.entity === 'Entry') {
    data['content_type_id'] = get(eventData, 'response.sys.contentType.sys.id');
    data['revision'] = get(eventData, 'response.sys.revision');
  }
  return data;
}

function getBaseData(eventData) {
  return {
    executing_user_id: eventData.userId,
    organization_id: eventData.organizationId,
    space_id: eventData.spaceId,
  };
}
