import { first, last, merge } from 'lodash';
import { getSchema } from 'analytics/snowplow/Schemas';

export default function(eventName, data) {
  const experiment = {
    data: merge(
      {
        action: 'interaction',
        experiment_id: data.experiment.id,
        variation: data.experiment.variation
      },
      getUserOrgSpace(data)
    ),
    schema: getSchema('experiment').path
  };

  return {
    data: merge(
      {
        scope: extractScope(eventName),
        action: extractAction(eventName)
      },
      getUserOrgSpace(data)
    ),
    contexts: [experiment]
  };
}

function extractScope(eventName) {
  return first(eventName.split(':'));
}

function extractAction(eventName) {
  return last(eventName.split(':'));
}

function getUserOrgSpace(data) {
  return {
    organization_id: data.organizationId,
    space_id: data.spaceId,
    executing_user_id: data.userId
  };
}
