import { pick } from 'lodash';
import { getSchema } from 'analytics/snowplow/Schemas.es6';
import { addUserOrgSpace } from './Decorators.es6';

export default addUserOrgSpace((_, segmentData) => {
  return {
    data: {
      scope: 'ui_extension',
      action: 'render'
    },
    contexts: [
      {
        schema: getSchema('extension_render').path,
        // Remove properties automatically added by Segment client.
        data: pick(segmentData, [
          'location',
          'extension_id',
          'extension_definition_id',
          'extension_name',
          'src',
          'installation_params',
          'instance_params'
        ])
      }
    ]
  };
});
