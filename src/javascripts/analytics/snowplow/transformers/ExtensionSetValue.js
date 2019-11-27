import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((_, data) => {
  return {
    data: {
      content_type_id: data.contentTypeId,
      entry_id: data.entryId,
      field_id: data.fieldId,
      locale_code: data.localeCode,
      extension_id: data.extensionId,
      // TODO: rename property in v2 of the schema.
      extension_definition_id: data.appDefinitionId || null
    }
  };
});
