import $location from '$location';
import $state from '$state';
import { get, findIndex } from 'lodash';
import { track } from 'analytics/Analytics';

const SLIDE_IN_QS = 'previousEntries';
const TYPES = { ASSET: 'Asset', ENTRY: 'Entry' };
const TYPE_PLURALS = { Asset: 'assets', Entry: 'entries' };

/**
 * Returns all currently displayed entities including the top slide. Contains no
 * duplicates as the same entity can not be displayed twice. An asset will always
 * be the top entry (last array value).
 *
 * @returns {Object} Entity with "id" and "type" properties.
 */
export function getSlideInEntities () {
  const slideInEntities = deserializeQS();
  const { entryId, assetId } = $state.params;
  if (entryId) {
    const entry = { id: entryId, type: TYPES.ENTRY };
    return slideInEntities.filter((v) => v.id !== entry.id).concat([entry]);
  } else if (assetId) {
    return slideInEntities.concat([{ id: assetId, type: TYPES.ASSET }]);
  } else {
    return slideInEntities;
  }
}

/**
 * Helper for calling `$state.go()` with the correct parameters that will result
 * in the given entity being shown in the stack of slided-in entities.
 *
 * @param {Entity} entity Entity with "id" and "type" properties.
 * @param {Number|Boolean} featureFlagValue
 */
export function goToSlideInEntity (entity, featureFlagValue) {
  const currentEntities = getSlideInEntities();
  const entities = [...currentEntities, entity];
  const entityIndex = findIndex(entities, entity);
  const reducedEntities = entities.slice(0, entityIndex);
  if (
    currentEntities.length - 1 < reducedEntities.length &&
    !canSlideIn(featureFlagValue)
  ) {
    goToEntity(entity);
    return { currentSlideLevel: 0, targetSlideLevel: 0 };
  }
  const serializedEntities = reducedEntities.map(({ id }) => id).join(',');
  const idKey = `${entity.type.toLowerCase()}Id`;
  const params = {
    [idKey]: entity.id,
    [SLIDE_IN_QS]: serializedEntities
  };
  const typePlural = TYPE_PLURALS[entity.type];
  $state.go(`^.^.${typePlural}.detail`, params);

  return {
    currentSlideLevel: currentEntities.length - 1,
    targetSlideLevel: entityIndex
  };
}

export function goToPreviousSlideOrExit (featureFlagValue, eventLabel, onExit) {
  const slideInEntities = getSlideInEntities();
  const numEntities = slideInEntities.length;
  if (numEntities > 1) {
    const previousEntity = slideInEntities[numEntities - 2];
    const eventData = goToSlideInEntity(previousEntity, featureFlagValue);
    if (eventData.currentSlideLevel > 0) {
      track(`slide_in_editor:${eventLabel}`, eventData);
    }
  } else {
    onExit();
  }
}

function goToEntity (entity) {
  if (entity.type === TYPES.ENTRY) {
    $state.go('.', { entryId: entity.id, previousEntries: '' });
  } else {
    $state.go('^.^.assets.detail', { assetId: entity.id, previousEntries: '' });
  }
}

function deserializeQS () {
  const searchObject = $location.search();
  const serializedEntities = get(searchObject, SLIDE_IN_QS, '')
    .split(',').filter((v, i, self) => v !== '' && self.indexOf(v) === i);
  return serializedEntities.map((id) => ({ id, type: TYPES.ENTRY }));
}

function canSlideIn (featureFlag) {
  // We ignore state `1` (only one level of slide-in) since we no longer want to
  // maintain this. 0, 1: feature off, 2: feature on (inifinite levels)
  return featureFlag === 2 || featureFlag === true;
}
