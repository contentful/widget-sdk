import $location from '$location';
import $state from '$state';
import { findIndex, get, isEqual, uniqWith } from 'lodash';
import { track } from 'analytics/Analytics';
import slideHelper from './slideHelper';

const SLIDES_BELOW_QS = 'previousEntries';

/**
 * Returns all currently displayed entities including the top slide. Contains no
 * duplicates as the same entity can not be displayed twice. An asset can only be
 * the top slide (last array value).
 *
 * @returns {Slide[]} Entity with "id" and "type" properties.
 */
export function getSlideInEntities () {
  const slidesBelow = deserializeQS();
  const topSlide = slideHelper.newFromStateParams($state.params);
  return uniqWith([...slidesBelow, topSlide], isEqual).filter((v) => !!v);
}

/**
 * Helper for calling `$state.go()` with the correct parameters that will result
 * in the given entity being shown in the stack of slided-in entities.
 *
 * @param {Slide} slide New top slide.
 * @param {Number|Boolean} featureFlagValue
 * @returns {currentSlideLevel: number, targetSlideLevel: number}
 */
export function goToSlideInEntity (slide, featureFlagValue) {
  const currentSlides = getSlideInEntities();
  const slides = [...currentSlides, slide];
  // If `slide` is open already, go back to that level instead of adding one more.
  const firstTargetSlideIndex = findIndex(slides, slide);
  const reducedSlides = slides.slice(0, firstTargetSlideIndex);
  if (
    currentSlides.length - 1 < reducedSlides.length &&
    !canSlideIn(featureFlagValue)
  ) {
    goToEntity(slide);
    return { currentSlideLevel: 0, targetSlideLevel: 0 };
  }
  const slidesBelowQS = reducedSlides.map(slideHelper.toString).join(',');
  $state.go(...slideHelper.toStateGoArgs(slide, { [SLIDES_BELOW_QS]: slidesBelowQS }));

  return {
    currentSlideLevel: currentSlides.length - 1,
    targetSlideLevel: firstTargetSlideIndex
  };
}

/**
 * Removes the current top level slide.
 *
 * @param {number|boolean} featureFlagValue `true` or `2` means "on"
 * @param {string} eventLabel
 * @param {Function} onExit Invoked when the last slide is closed
 */
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

function goToEntity (slide) {
  $state.go(...slideHelper.toStateGoArgs(slide, { [SLIDES_BELOW_QS]: '' }));
}

function deserializeQS () {
  const searchObject = $location.search();
  const serializedEntities = get(searchObject, SLIDES_BELOW_QS, '')
    .split(',').filter((v, i, self) => v !== '' && self.indexOf(v) === i);
  return serializedEntities.map((id) => slideHelper.newFromQS(id));
}

function canSlideIn (featureFlag) {
  // We ignore state `1` (only one level of slide-in) since we no longer want to
  // maintain this. 0, 1: feature off, 2: feature on (inifinite levels)
  return featureFlag === 2 || featureFlag === true;
}
