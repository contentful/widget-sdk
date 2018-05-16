import $location from '$location';
import $state from '$state';
import { get, castArray, findIndex, mapKeys } from 'lodash';

// TODO: Ideally we'd have the entity which is top of the stack represented in the
// current url path, all entities stacked below in the `slidein` parameter. That
// way we wouldn't have to differentiate between entry and asset in `slideIn` since
// they would always be entries only (assets do not have references).

const SLIDE_IN_QS = 'slideIn';
const TYPES = {
  ASSET: 'Asset',
  ENTRY: 'Entry'
};

const convertToEntityType = value => {
  if (value.toLowerCase() === TYPES.ENTRY.toLowerCase()) {
    return TYPES.ENTRY;
  } else if (value.toLowerCase() === TYPES.ASSET.toLowerCase()) {
    return TYPES.ASSET;
  }
  throw new Error(`Entity type ${value} is not supported`);
};

const deserializeQS = () => {
  const searchObject = mapKeys($location.search(), (_, k) => k.toLowerCase());
  const serializedEntities = castArray(get(searchObject, SLIDE_IN_QS.toLowerCase(), []));
  return serializedEntities.map(string => {
    const [type, id] = string.split(':');
    return {
      type: convertToEntityType(type),
      id
    };
  });
};

const getMaxLevelFromFeatureFlag = value =>
  [0, 1].includes(value) ? value : Infinity;

const canSlideIn = maxSlideInLevel =>
  getSlideInEntities().length - 1 < maxSlideInLevel;

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

export const goToSlideInEntity = (entity, featureFlagValue) => {
  if (!canSlideIn(getMaxLevelFromFeatureFlag(featureFlagValue))) {
    if (entity.type === TYPES.ENTRY) {
      $state.go('.', { entryId: entity.id });
    } else {
      $state.go('^.^.assets.detail', { assetId: entity.id });
    }
    return;
  }
  const entities = [...getSlideInEntities(), entity];
  const entityIndex = findIndex(entities, entity);
  const reducedEntities = entities.slice(1, entityIndex + 1);
  const serializedEntities = reducedEntities.map(
    ({ id, type }) => `${type}:${id}`
  );
  $location.search(SLIDE_IN_QS, serializedEntities);
};

export const goToPreviousSlideOrExit = (featureFlagValue, onExit) => {
  const slideInEntities = getSlideInEntities();
  const numEntities = slideInEntities.length;
  if (numEntities > 1) {
    const previousEntity = slideInEntities[numEntities - 2];
    goToSlideInEntity(previousEntity, featureFlagValue);
  } else {
    onExit();
  }
};
