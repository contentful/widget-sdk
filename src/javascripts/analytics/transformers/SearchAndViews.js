import { addUserOrgSpace } from './Decorators';
import { get, omit } from 'lodash';

const ENTITY_TYPE_MAPPING = { entries: 'entry', assets: 'asset' };
const PROPS_TO_OMIT = ['userId', 'spaceId', 'organizationId', 'currentState'];

export default addUserOrgSpace((_event, data) => {
  return {
    data: {
      entity_type: getEntityType(data),
      ...omit(data, PROPS_TO_OMIT),
    },
  };
});

function getEntityType(data) {
  const currentState = get(data, ['currentState'], '');
  const entityTypeSegment = currentState.split('.')[2];
  return ENTITY_TYPE_MAPPING[entityTypeSegment];
}
