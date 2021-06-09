import { addUserOrgSpace } from './Decorators';
import { get } from 'lodash';

export default addUserOrgSpace((_eventName, eventData) => {
  const { contentType, eventOrigin } = eventData;
  const entryId = get(eventData, 'response.sys.id');
  const data = {};

  if (entryId) {
    data.entry_id = entryId;
    data.entry_version = get(eventData, 'response.sys.version');
  }
  if (eventOrigin) {
    data.event_origin = eventOrigin;
  }
  if (contentType) {
    data.content_type_id = get(contentType, 'sys.id');
    data.entry_ct_fields_count = contentType.fields.length;
    data.entry_ct_entry_reference_fields_count = countEntryReferenceFields(contentType);
  }

  if (eventData.widgetTrackingContexts) {
    // Used for `entry:publish`, not for `entry:create`
    return {
      data,
      contexts: eventData.widgetTrackingContexts,
    };
  }
  return { data };
});

/**
 *
 * @param {*} contentTypeDto JSON Data Transfer Object; not a VO returned by the SDK.
 */
function countEntryReferenceFields(contentTypeDto) {
  return contentTypeDto.fields.filter(
    ({ items = {}, ...field }) =>
      isEntryReferenceField(field) || (field.type === 'Array' && isEntryReferenceField(items))
  ).length;
}

function isEntryReferenceField({ type, linkType }) {
  return type === 'Link' && linkType === 'Entry';
}
