import { addUserOrgSpace } from './Decorators.es6';

export default addUserOrgSpace((_, data) => {
  return {
    data: {
      content_type_id: data.contentTypeId,
      entry_id: data.entryId,
      field_id: data.fieldId,
      locale_code: data.localeCode,
      extension_id: data.extensionId,
      extension_definition_id: data.extensionDefinitionId
    }
  };
});
