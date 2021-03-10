import { getSnowplowSchema } from 'analytics/SchemasSnowplow';
import { isUndefined, omitBy } from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/AppOpen
 * @description
 * Exports a function that transforms data for the app open event
 */
export default function (_eventName, data) {
  return {
    data: {},
    contexts: [
      {
        schema: getSnowplowSchema('app').path,
        data: omitBy(
          {
            action: 'open',
            organization_id: data.organizationId,
            space_id: data.spaceId,
            executing_user_id: data.userId,
          },
          isUndefined
        ),
      },
    ],
  };
}
