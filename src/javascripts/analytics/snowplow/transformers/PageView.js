import { addUserOrgSpace } from './Decorators';
import { pickBy, identity } from 'lodash';

export default addUserOrgSpace((_, data) => {
  return {
    data: pickBy(
      {
        to_state: data.state,
        to_state_params: data.params,
        from_state: data.fromState,
        from_state_params: data.fromStateParams
      },
      identity
    )
  };
});
