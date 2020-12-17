import { goToSlideInEntity, SlideEventTypes, slideInStackEmitter } from './index';

export async function goToSlideInEntityWithPromise(slide) {
  return new Promise((resolve) => {
    let result = {
      newSlideLevel: -1,
      oldSlideLevel: -1,
    };

    const onGoBack = (newState) => {
      if (newState.newSlideLevel === result.oldSlideLevel) {
        slideInStackEmitter.off(SlideEventTypes.SLIDE_LEVEL_CHANGED, onGoBack);
        resolve(result);
      }
    };

    slideInStackEmitter.on(SlideEventTypes.SLIDE_LEVEL_CHANGED, onGoBack);

    result = goToSlideInEntity(slide);
  });
}
