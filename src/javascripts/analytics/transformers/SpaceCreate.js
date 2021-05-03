import { getSnowplowSchema } from 'analytics/SchemasSnowplow';
import { getSpaceWizardData } from './SpaceWizard';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/CreateSpace
 * @description
 * Exports a function that transforms data for the `space:create`
 * event into Snowplow's format
 */
export default function SpaceCreate(_eventName, data) {
  const baseData = getBaseData(data);
  const contexts = [
    {
      schema: getSnowplowSchema('space').path,
      data: { action: 'create', ...baseData },
    },
  ];

  if (data.templateName) {
    contexts.push({
      schema: getSnowplowSchema('space_template').path,
      data: { name: data.templateName, ...baseData },
    });
  }

  // if the space is marked as created for the user by us
  // add object matching entity_automation_scope schema
  // to the context as well
  if (data.entityAutomationScope) {
    contexts.push({
      schema: getSnowplowSchema('entity_automation_scope').path,
      data: { scope: data.entityAutomationScope.scope, ...baseData },
    });
  }

  // if called from space wizard
  if (data.wizardData) {
    contexts.push({
      schema: getSnowplowSchema('feature_space_wizard').path,
      data: { ...getSpaceWizardData(data.wizardData, 'space_create'), ...baseData },
    });
  }

  return {
    data: {},
    contexts,
  };
}

function getBaseData(data) {
  return {
    organization_id: data.organizationId,
    space_id: data.spaceId,
    executing_user_id: data.userId,
  };
}
