import { get, isEqual, uniqWith } from 'lodash';
import { track } from 'analytics/Analytics';
import slideHelper from './slideHelper';
import { getModule } from 'NgRegistry';
import mitt from 'mitt';

const SLIDES_BELOW_QS = 'previousEntries';

export const slideInStackEmitter = mitt();

export const onSlideInNavigation = (fn) => {
  const funcWrapper = ({ newSlideLevel, oldSlideLevel }) => {
    fn({ newSlideLevel, oldSlideLevel });
  };
  slideInStackEmitter.on('changed', funcWrapper);
  return () => {
    slideInStackEmitter.off('changed', funcWrapper);
  };
};

/**
 * Serializes a given slide as a string.
 *
 * @param {Slide} slide
 * @returns {string}
 */
export const getSlideAsString = slideHelper.toString;

/**
 * Returns all currently displayed entities including the top slide. Contains no
 * duplicates as the same entity can not be displayed twice. An asset can only be
 * the top slide (last array value).
 *
 * @returns {Slide[]} Entity with "id" and "type" properties.
 */
export function getSlideInEntities() {
  const $state = getModule('$state');

  const slidesBelow = deserializeQS();
  const topSlide = slideHelper.newFromStateParams($state.params);
  return uniqWith([...slidesBelow, topSlide], isEqual).filter((v) => !!v);
}

/**
 * Helper for calling `$state.go()` with the correct parameters that will result
 * in the given entity being shown in the stack of slided-in entities.
 *
 * @param {Slide} slide New top slide.
 * @returns {newSlideLevel: number, oldSlideLevel: number}
 */
export function goToSlideInEntity(slide) {
  const $state = getModule('$state');

  const currentSlides = getSlideInEntities();
  const slides = [...currentSlides, slide];
  // If `slide` is open already, go back to that level instead of adding one more.
  const firstTargetSlideIndex = slides.findIndex(
    (item) => item.id === slide.id && item.type === item.type
  );
  const reducedSlides = slides.slice(0, firstTargetSlideIndex);
  const slidesBelowQS = reducedSlides.map(slideHelper.toString).join(',');
  $state.go(...slideHelper.toStateGoArgs(slide, { [SLIDES_BELOW_QS]: slidesBelowQS }));

  const result = {
    newSlideLevel: firstTargetSlideIndex,
    oldSlideLevel: currentSlides.length - 1,
  };

  slideInStackEmitter.emit('changed', result);

  return result;
}

/**
 * Removes the current top level slide.
 *
 * @param {string} eventLabel
 * @param {Function} onExit? Invoked when the last slide is closed. Navigates to
 * the current state's list if omitted.
 */
export function goToPreviousSlideOrExit(eventLabel, onExit) {
  const $state = getModule('$state');

  const slideInEntities = getSlideInEntities();
  const numEntities = slideInEntities.length;
  if (numEntities > 1) {
    const previousEntity = slideInEntities[numEntities - 2];
    const eventData = goToSlideInEntity(previousEntity);
    if (eventData.oldSlideLevel > 0) {
      track(`slide_in_editor:${eventLabel}`, eventData);
    }
  } else {
    onExit ? onExit() : $state.go('^.list');
  }
}

function deserializeQS() {
  const $location = getModule('$location');

  const searchObject = $location.search();
  const serializedEntities = get(searchObject, SLIDES_BELOW_QS, '')
    .split(',')
    .filter((v, i, self) => v !== '' && self.indexOf(v) === i);
  return serializedEntities.map((id) => slideHelper.newFromQS(id));
}
