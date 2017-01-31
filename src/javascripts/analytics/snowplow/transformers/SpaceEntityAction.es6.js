import {extend, get, snakeCase} from 'lodash';
import {getSchema} from 'analytics/snowplow/Schemas';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/SpaceEntityAction
 * @description
 * Exports a function that transforms space entity actions (e.g. entry publish,
 * content type create) to Snowplow format, including the entity as a linked context.
 */
export default function (_eventName, entityData) {
  const contexts = [getEntityContext(entityData)];
  if (entityData.templateName) {
    contexts.push(getSpaceTemplateContext(entityData));
  }

  return {
    data: {},
    contexts: contexts
  };
}

function getEntityContext (entityData) {
  const schema = getSchema(snakeCase(entityData.actionData.entity));
  return {
    'schema': schema.path,
    'data': extend(
      getBaseEntityData(entityData),
      getEntitySpecificData(schema.name, entityData)
    )
  };
}

function getBaseData (entityData) {
  return {
    'executing_user_id': entityData.userId,
    'organization_id': entityData.organizationId,
    'space_id': entityData.spaceId
  };
}

function getBaseEntityData (entityData) {
  return extend({
    'action': entityData.actionData.action,
    'version': entityData.response.data.sys.version
  }, getBaseData(entityData));
}

function getEntitySpecificData (schemaName, entityData) {
  const data = {};
  data[`${schemaName}_id`] = get(entityData, 'response.data.sys.id');
  // We track 2 additional fields on entries compared to all other entities
  if (entityData.actionData.entity === 'Entry') {
    data['content_type_id'] = get(entityData, 'response.data.sys.contentType.sys.id');
    data['revision'] = get(entityData, 'response.data.sys.revision');
  }
  return data;
}

function getSpaceTemplateContext (entityData) {
  return {
    'schema': getSchema('space_template').path,
    'data': extend({'name': entityData.templateName}, getBaseData(entityData))
  };
}
