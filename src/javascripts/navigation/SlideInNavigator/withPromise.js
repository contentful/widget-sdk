import { goToSlideInEntity, slideInStackEmitter } from './index';

export async function goToSlideInEntityWithPromise(slide) {
  return new Promise(resolve => {
    let result = {
      targetSlideLevel: -1,
      currentSlideLevel: -1
    };

    const onGoBack = newState => {
      if (newState.targetSlideLevel === result.currentSlideLevel) {
        slideInStackEmitter.off('changed', onGoBack);
        resolve(result);
      }
    };

    slideInStackEmitter.on('changed', onGoBack);

    result = goToSlideInEntity(slide);
  });
}
