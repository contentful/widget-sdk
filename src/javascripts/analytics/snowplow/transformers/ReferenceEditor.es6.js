import { addUserOrgSpace } from './Decorators';
import $state from '$state';

export default addUserOrgSpace((eventName, data) => ({
  data: {
    content_type_id: data.ctId,
    event_type: extractAction(eventName),
    parent_entry_id: extractParentEntryId()
  }
}));

function extractAction (eventName) {
  return eventName.split(':')[1];
}

function extractParentEntryId () {
  return $state.params.previousEntries ? $state.params.previousEntries.split(',').pop() : $state.params.entryId;
}
