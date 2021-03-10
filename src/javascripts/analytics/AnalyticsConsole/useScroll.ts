import * as React from 'react';

export const useScroll = <T extends HTMLElement>(): [
  React.MutableRefObject<T | null>,
  { scrollUp: Function; scrollDown: Function }
] => {
  const ref = React.useRef<T | null>(null);

  const actions = React.useMemo(() => {
    const scroll = (top = 0) => {
      ref.current?.scroll({
        top,
        left: 0,
        behavior: 'smooth',
      });
    };
    const scrollUp = () => scroll();
    const scrollDown = () => scroll(ref.current?.scrollHeight);
    return { scrollUp, scrollDown };
  }, []);

  return [ref, actions];
};
