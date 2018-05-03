import $location from '$location';
import $state from '$state';
import { get, castArray, findIndex } from 'lodash';

// TODO: Ideally we'd have the entity which is top of the stack represented in the
// current url path, all entities stacked below in the `slideIn` parameter. That
// way we wouldn't have to differentiate between entry and asset in `slideIn` since
// they would always be entries only (assets do not have references).

const SLIDE_IN_QS = 'slideIn';
const TYPES = { ASSET: 'Asset', ENTRY: 'Entry' };

export function getSlideInEntities () {
  const slideInEntities = deserializeQS();
  const { entryId, assetId } = $state.params;
  if (entryId) {
    slideInEntities.unshift({ id: entryId, type: TYPES.ENTRY });
  } else if (assetId) {
    slideInEntities.unshift({ id: assetId, type: TYPES.ASSET });
  }
  return slideInEntities;
}

const getMaxLevelFromFeatureFlag = value => {
  if (value === 0) {
    return 0;
  }
  if (value === 1) {
    return 1;
  }
  return Infinity;
};

const canSlideIn = maxSlideInLevel => {
  return getSlideInEntities().length - 1 < maxSlideInLevel;
};

export const goToSlideInEntity = (entity, featureFlagValue = false) => {
  let entities = getSlideInEntities();

  if (!canSlideIn(getMaxLevelFromFeatureFlag(featureFlagValue))) {
    if (entity.type === TYPES.ENTRY) {
      $state.go('.', { entryId: entity.id });
    } else {
      $state.go('^.^.assets.detail', { assetId: entity.id });
    }
    return;
  }
  entities = [...entities, entity];
  const entityIndex = findIndex(entities, entity);
  const reducedEntities = entities.slice(1, entityIndex + 1);
  const serializedEntities = reducedEntities.map(
    ({ id, type }) => `${type}:${id}`
  );
  $location.search(SLIDE_IN_QS, serializedEntities);
};

function deserializeQS () {
  const searchObject = $location.search();
  const serializedEntities = castArray(get(searchObject, SLIDE_IN_QS, []));
  return serializedEntities.map(string => {
    const [type, id] = string.split(':');
    return { type, id };
  });
}
