import { addUserOrgSpace } from './Decorators.es6';

export default addUserOrgSpace((_, data) => {
  return {
    data: {
      extension_id: data.extensionId,
      location: data.location,
      extension_definition_id: data.extensionDefinitionId || null
    }
  };
});
