import { addUserOrgSpace } from './Decorators';
import { omit } from 'lodash';

// Props we send to Segment but want to omit from Snowplow payload.
// We include this information with `addUserOrgSpace`
const SEGMENT_PROPS = ['userId', 'spaceId', 'organizationId', 'currentState'];

export default addUserOrgSpace((_, data) => {
  return {data: omit(data, SEGMENT_PROPS)};
});
