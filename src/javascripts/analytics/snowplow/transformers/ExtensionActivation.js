import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((_, data) => {
  return {
    data: {
      extension_id: data.extensionId,
      location: data.location,
      // TODO: rename property in v2 of the schema.
      extension_definition_id: data.appDefinitionId || null
    }
  };
});
