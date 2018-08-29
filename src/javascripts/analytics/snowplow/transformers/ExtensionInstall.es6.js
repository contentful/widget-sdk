import { addUserOrgSpace } from './Decorators';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/ExtensionInstall
 * @description
 * Exports a function that transforms data for the extension install event
 */
export default addUserOrgSpace(getExtensionInstallData);

function getExtensionInstallData(_eventName, data) {
  return {
    data: {
      ui_extension_id: data.ui_extension_id,
      name: data.name,
      type: data.type,
      url: data.url,
      src: data.src,
      installation_params: data.installationParams,
      instance_params: data.instanceParams,
      field_types: data.fieldTypes
    }
  };
}
