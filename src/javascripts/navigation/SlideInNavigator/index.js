import { isEqual, uniqWith } from 'lodash';
import { track } from 'analytics/Analytics';
import slideHelper from './slideHelper';
import { getModule } from 'core/NgRegistry';
import mitt from 'mitt';

const SLIDES_BELOW_QS = 'previousEntries';

export const slideInStackEmitter = mitt();

export const SlideEventTypes = {
  SLIDE_LEVEL_CHANGED: 'slideLevelChanged',
  PARAMS_CHANGED: 'paramsChanged',
};

export const onSlideLevelChanged = (fn) => {
  const funcWrapper = ({ newSlideLevel, oldSlideLevel }) => {
    fn({ newSlideLevel, oldSlideLevel });
  };
  slideInStackEmitter.on(SlideEventTypes.SLIDE_LEVEL_CHANGED, funcWrapper);
  return () => {
    slideInStackEmitter.off(SlideEventTypes.SLIDE_LEVEL_CHANGED, funcWrapper);
  };
};

export const onSlideStateChanged = (fn) => {
  slideInStackEmitter.on(SlideEventTypes.PARAMS_CHANGED, fn);
  return () => {
    slideInStackEmitter.off(SlideEventTypes.PARAMS_CHANGED, fn);
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
 * @param {object} state = getModule('$state')
 * @returns {Slide[]} Entity with "id" and "type" properties.
 */
export function getSlideInEntities(params = getModule('$state').params) {
  const slidesBelow = deserializeQS(params[SLIDES_BELOW_QS]);
  const topSlide = slideHelper.newFromStateParams(params);
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

  const [path, params] = slideHelper.toStateGoArgs(slide, { [SLIDES_BELOW_QS]: slidesBelowQS });
  $state.go(path, params, { notify: false });

  const result = {
    newSlideLevel: firstTargetSlideIndex,
    oldSlideLevel: currentSlides.length - 1,
  };

  slideInStackEmitter.emit(SlideEventTypes.SLIDE_LEVEL_CHANGED, result);
  slideInStackEmitter.emit(SlideEventTypes.PARAMS_CHANGED, params);
  return result;
}

/**
 * Removes the current top level slide.
 *
 * @param {string} eventLabel
 * @param {Function} onExit? Invoked when the last slide is closed. Navigates to
 * the current state's list if omitted.
 */
export function goToPreviousSlideOrExit(eventLabel, onExit = null) {
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

function getSlidesBelowFromQS() {
  const params = new URLSearchParams(window.location.search);
  return params.get(SLIDES_BELOW_QS) ?? '';
}

function deserializeQS(slidesBelowQS = getSlidesBelowFromQS()) {
  const serializedEntities = slidesBelowQS
    .split(',')
    .filter((v, i, self) => v !== '' && self.indexOf(v) === i);
  return serializedEntities.map((id) => slideHelper.newFromQS(id));
}
