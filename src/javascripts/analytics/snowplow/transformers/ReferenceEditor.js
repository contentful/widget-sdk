import { addUserOrgSpace } from './Decorators';
import { getModule } from 'NgRegistry.es6';

export default addUserOrgSpace((eventName, data) => ({
  data: {
    content_type_id: data.ctId,
    event_type: extractAction(eventName),
    parent_entry_id: extractParentEntryId()
  }
}));

function extractAction(eventName) {
  return eventName.split(':')[1];
}

function extractParentEntryId() {
  const $state = getModule('$state');

  return $state.params.previousEntries
    ? $state.params.previousEntries.split(',').pop()
    : $state.params.entryId;
}
