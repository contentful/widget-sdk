import { addUserOrgSpace } from './Decorators';
import { get as getAtPath, omit, extend } from 'lodash';

const ENTITY_TYPE_MAPPING = {entries: 'entry', assets: 'asset'};
const PROPS_TO_OMIT = ['userId', 'spaceId', 'organizationId', 'currentState'];

export const ViewTransform = addUserOrgSpace((_, data) => {
  return {
    data: extend(
      {entity_type: getEntityType(data)},
      omit(data, PROPS_TO_OMIT)
    )
  };
});

function getEntityType (data) {
  const currentState = getAtPath(data, ['currentState'], '');
  const entityTypeSegment = currentState.split('.')[2];
  return ENTITY_TYPE_MAPPING[entityTypeSegment];
}
