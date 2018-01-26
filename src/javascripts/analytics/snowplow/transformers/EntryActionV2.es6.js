import EntityAction from './EntityAction';

export default function (eventName, eventData) {
  const data = EntityAction(eventName, eventData);
  data.data = Object.assign(data.data || {}, getData(eventData));
  return data;
}

function getData (eventData) {
  const data = getBaseData(eventData);
  if (eventData.eventOrigin) {
    data['event_origin'] = eventData.eventOrigin;
  }
  // TODO:danwe Add `number_of_reference_fields` field.
  return data;
}

function getBaseData (eventData) {
  return {
    'executing_user_id': eventData.userId,
    'organization_id': eventData.organizationId,
    'space_id': eventData.spaceId
  };
}
