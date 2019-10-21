import { getSchema } from 'analytics/snowplow/Schemas.es6';
import { addUserOrgSpace } from './Decorators.es6';

/**
 * Transforms data for the feature_text_editor snowplow event.
 *
 * @returns {object}
 */
export default addUserOrgSpace((_eventName, data) => {
  return {
    schema: getSchema('feature_text_editor').path,
    data: {
      action: data.action,
      action_origin: data.actionOrigin || null,
      editor_name: data.editorName,
      entry_id: data.entryId,
      content_type_id: data.contentTypeId,
      field_locale: data.fieldLocale,
      field_id: data.fieldId,
      is_fullscreen: data.isFullscreen,
      character_count_before: data.characterCountBefore || null,
      character_count_after: data.characterCountAfter || null,
      character_count_selection: data.characterCountSelection || null,
      additional_data: data.additionalData || {}
    }
  };
});
