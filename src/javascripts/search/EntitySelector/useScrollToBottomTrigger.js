import { useEffect } from 'react';
import { throttle } from 'lodash';

/*
  Triggers a handler function once the user scrolled to the bottom of a viewport
*/
const useScrollToBottomTrigger = ({ target, handler }) => {
  const threshold = 200;

  useEffect(() => {
    const isVisible = (elem) => {
      // taken from jquery source
      return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    };

    const onBottomReached = (elem) => {
      if (!isVisible(elem)) return;
      const scrollBottom = elem.scrollTop + elem.clientHeight;
      if (elem.scrollHeight - threshold <= scrollBottom) {
        handler();
      }
    };

    const throttledOnBottomReached = throttle(onBottomReached, 100);
    const onScroll = () => {
      throttledOnBottomReached(target);
    };

    if (target) {
      target.addEventListener('scroll', onScroll);
    }

    return () => {
      if (target) {
        target.removeEventListener('scroll', onScroll);
      }
    };
  }, [target, handler]);
};

export default useScrollToBottomTrigger;
