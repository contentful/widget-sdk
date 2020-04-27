import { useCallback } from 'react';

/*
 * React hook element to it's top position.
 * @param {string} selector - css selector eg. ".my-element".
 * @param {number} top - target value for top attribute.
 */
export function useScrollToTop(selector, top = 0) {
  return useCallback(() => {
    const element = document.querySelector(selector);
    element.scrollTo({ top, behavior: 'smooth' });
  }, [selector, top]);
}
