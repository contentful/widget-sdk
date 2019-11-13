import { useRef, useEffect } from 'react';

/**
 * A hook to retrive a previous value of a state or prop.
 * see: https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
 * @param {*} value
 */
export default function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
