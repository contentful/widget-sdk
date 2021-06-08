import EntityAction from './EntityAction';
import { get, upperFirst } from 'lodash';

export default function EntryActionV2(eventName, eventData) {
  const [downcaseEntity, action] = eventName.split(':');
  const entity = upperFirst(downcaseEntity);
  const fullEventData = { ...eventData, actionData: { entity, action } };
  const data = {
    data: getData(eventData),
  };
  const { contexts } = EntityAction(eventName, fullEventData);
  if (contexts && contexts.length) {
    // For 'entry:publish' event: 1 `sidebar_render` and 0…* `extension_render`
    // `entry:create` event should have 0 contexts.
    data.contexts = contexts;
  }
  return data;
}

function getData(eventData) {
  const data = getBaseData(eventData);
  const { contentType, eventOrigin } = eventData;
  const entryId = get(eventData, 'response.sys.id');

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
  return data;
}

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

function getBaseData(eventData) {
  return {
    executing_user_id: eventData.userId,
    organization_id: eventData.organizationId,
    space_id: eventData.spaceId,
  };
}
