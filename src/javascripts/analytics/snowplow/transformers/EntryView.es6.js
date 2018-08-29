import { getSchema } from 'analytics/snowplow/Schemas';
import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((_, data) => ({
  data: {
    entry_id: data.entryId,
    content_type_id: data.ctId,
    content_type_name: data.ctName,
    slide_in_level: data.currentSlideLevel,
    editor_type: data.editorType
  },
  contexts: [
    ...data.referencesCTMetadata.map(refMetadata => getReferenceContext(refMetadata, data.entryId)),
    ...customWidgetsContexts(data)
  ]
}));

function getReferenceContext(refMetadata, parentEntryId) {
  return {
    schema: getSchema('feature_reference_metadata').path,
    data: {
      content_type_id: refMetadata.id,
      content_type_name: refMetadata.name,
      parent_entry_id: parentEntryId
    }
  };
}

function customWidgetsContexts(eventData) {
  if (Array.isArray(eventData.customWidgets)) {
    const schema = getSchema('extension_render').path;
    return eventData.customWidgets.map(data => ({ schema, data }));
  } else {
    return [];
  }
}
