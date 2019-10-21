import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/dialog
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getDialogData);

function getDialogData(_eventName, data) {
  return {
    schema: getSchema('dialog').path,
    data: {
      name: data.name,
      purpose: data.purpose,
      action: data.action
    }
  };
}
