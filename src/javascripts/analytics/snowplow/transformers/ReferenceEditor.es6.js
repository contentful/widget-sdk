import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((eventName, data) => ({
  data: {
    content_type_id: data.ctId,
    event_type: extractAction(eventName)
  }
}));

function extractAction (eventName) {
  return eventName.split(':')[1];
}
