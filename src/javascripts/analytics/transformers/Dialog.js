import { addUserOrgSpace } from './Decorators';
import { getSnowplowSchema } from 'analytics/SchemasSnowplow';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/dialog
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getDialogData);

function getDialogData(_eventName, data) {
  return {
    schema: getSnowplowSchema('dialog').path,
    data: {
      name: data.name,
      purpose: data.purpose,
      action: data.action,
    },
  };
}
