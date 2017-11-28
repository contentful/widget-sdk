import {isEmpty, omitBy} from 'lodash';
import {addUserOrgSpace} from './Decorators';

export default addUserOrgSpace((_, data) => {
  return {
    data: omitBy({
      element_id: data.elementId, // required
      group_id: data.groupId, // required
      from_state: data.fromState, // required
      to_state: data.toState // optional
    }, isEmpty)
  };
});
