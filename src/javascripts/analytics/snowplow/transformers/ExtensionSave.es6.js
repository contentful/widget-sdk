import { addUserOrgSpace } from './Decorators';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/ExtensionSave
 * @description
 * Exports a function that transforms data for the extension save event
 */
export default addUserOrgSpace(getExtensionSaveData);

function getExtensionSaveData(_eventName, data) {
  return {
    data: {
      ui_extension_id: data.ui_extension_id,
      name: data.name,
      type: data.type,
      src: data.src,
      installation_params: data.installationParams,
      instance_params: data.instanceParams,
      field_types: data.fieldTypes
    }
  };
}
