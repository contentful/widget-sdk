import {get, snakeCase} from 'lodash';
import {getSchema} from 'analytics/snowplow/Schemas';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/SpaceEntityAction
 * @description
 * Exports a function that transforms space entity actions (e.g. entry publish,
 * content type create) to Snowplow format, including the entity as a linked context.
 */
export default function (_eventName, eventData) {
  const contexts = [getEntityContext(eventData)];
  if (eventData.template) {
    contexts.push(getSpaceTemplateContext(eventData));
  }

  return {
    data: {},
    contexts: contexts
  };
}

function getSpaceTemplateContext (eventData) {
  return {
    'schema': getSchema('space_template').path,
    'data': Object.assign({'name': eventData.template}, getBaseData(eventData))
  };
}

function getEntityContext (eventData) {
  const schema = getSchema(snakeCase(eventData.actionData.entity));
  return {
    'schema': schema.path,
    'data': Object.assign(
      getBaseEntityData(eventData),
      getEntitySpecificData(schema.name, eventData)
    )
  };
}

function getBaseEntityData (eventData) {
  return Object.assign({
    'action': eventData.actionData.action,
    'version': eventData.response.data.sys.version
  }, getBaseData(eventData));
}

function getEntitySpecificData (schemaName, eventData) {
  const data = {};
  data[`${schemaName}_id`] = get(eventData, 'response.data.sys.id');
  // We track 2 additional fields on entries compared to all other entities
  if (eventData.actionData.entity === 'Entry') {
    data['content_type_id'] = get(eventData, 'response.data.sys.contentType.sys.id');
    data['revision'] = get(eventData, 'response.data.sys.revision');
  }
  return data;
}

function getBaseData (eventData) {
  return {
    'executing_user_id': eventData.userId,
    'organization_id': eventData.organizationId,
    'space_id': eventData.spaceId
  };
}
