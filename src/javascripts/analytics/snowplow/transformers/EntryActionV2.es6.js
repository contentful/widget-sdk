import EntityAction from './EntityAction';
import { get, upperFirst } from 'lodash';

export default function(eventName, eventData) {
  const [downcaseEntity, action] = eventName.split(':');
  const entity = upperFirst(downcaseEntity);
  const fullEventData = { ...eventData, actionData: { entity, action } };
  const trackingData = EntityAction(eventName, fullEventData);
  Object.assign(trackingData.data, getData(eventData));
  return trackingData;
}

function getData(eventData) {
  const data = getBaseData(eventData);
  const { contentType, eventOrigin } = eventData;
  const entryId = get(eventData, 'response.data.sys.id');

  if (entryId) {
    data['entry_id'] = entryId;
  }
  if (eventOrigin) {
    data['event_origin'] = eventOrigin;
  }
  if (contentType) {
    data['entry_ct_entry_reference_fields_count'] = countEntryReferenceFields(contentType);
  }
  return data;
}

function countEntryReferenceFields(contentType) {
  return contentType.data.fields.filter(
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
    space_id: eventData.spaceId
  };
}
