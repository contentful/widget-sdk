import { pick } from 'lodash';
import { getSnowplowSchema } from 'analytics/SchemasSnowplow';
import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((_, segmentData) => {
  return {
    data: {
      scope: 'ui_extension',
      action: 'render',
    },
    contexts: [
      {
        schema: getSnowplowSchema('extension_render').path,
        // Remove properties automatically added by Segment client.
        data: pick(segmentData, [
          'location',
          'extension_id',
          'extension_definition_id', // TODO: rename property in v2 of the schema.
          'extension_name',
          'src',
          'installation_params',
          'instance_params',
          'environment_id',
        ]),
      },
    ],
  };
});
