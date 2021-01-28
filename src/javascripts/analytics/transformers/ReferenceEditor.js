import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((eventName, data) => ({
  data: {
    event_type: extractAction(eventName),
    parent_entry_id: data.parentEntryId,
    parent_field_path: data.parentFieldPath.join(':'),
    entity_type: data.entityType,
    entity_id: data.entityId,
    content_type_id: data.ctId || null,
  },
}));

function extractAction(eventName) {
  return eventName.split(':')[1];
}
