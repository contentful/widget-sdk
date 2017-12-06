import { addUserOrgSpace } from './Decorators';
import { get as getAtPath, omit, extend } from 'lodash';

const ENTITY_TYPE_MAPPING = {entries: 'entry', assets: 'asset'};
const EVENTS_WITHOUT_ENTITY_TYPE = ['search:search_terms_migrated'];
const PROPS_TO_OMIT = ['userId', 'spaceId', 'organizationId', 'currentState'];

export default addUserOrgSpace((event, data) => {
  return {
    data: extend(
      eventHasEntityType(event) ? {} : { entity_type: getEntityType(data) },
      omit(data, PROPS_TO_OMIT)
    )
  };
});

function getEntityType (data) {
  const currentState = getAtPath(data, ['currentState'], '');
  const entityTypeSegment = currentState.split('.')[2];
  return ENTITY_TYPE_MAPPING[entityTypeSegment];
}

function eventHasEntityType (event) {
  return EVENTS_WITHOUT_ENTITY_TYPE.indexOf(event) > -1;
}
