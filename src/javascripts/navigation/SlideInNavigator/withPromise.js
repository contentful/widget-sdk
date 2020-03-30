import { goToSlideInEntity, slideInStackEmitter } from './index';

export async function goToSlideInEntityWithPromise(slide) {
  return new Promise((resolve) => {
    let result = {
      newSlideLevel: -1,
      oldSlideLevel: -1,
    };

    const onGoBack = (newState) => {
      if (newState.newSlideLevel === result.oldSlideLevel) {
        slideInStackEmitter.off('changed', onGoBack);
        resolve(result);
      }
    };

    slideInStackEmitter.on('changed', onGoBack);

    result = goToSlideInEntity(slide);
  });
}
