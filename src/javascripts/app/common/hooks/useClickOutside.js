import { useEffect } from 'react';
import { isArray, every } from 'lodash';

export default function useClickOutside(ref, isActive, cb) {
  // run callback function if target is not inside ref
  const handleClickOutside = evt => {
    if (isArray(ref)) {
      every(ref, r => !r.current.contains(evt.target)) && cb();
      return;
    }
    !ref.current.contains(evt.target) && cb();
  };

  useEffect(() => {
    if (isActive) {
      document.addEventListener('mouseup', handleClickOutside);
    } else {
      document.removeEventListener('mouseup', handleClickOutside);
    }

    // remove listener when the component is unmounted
    return () => document.removeEventListener('mouseup', handleClickOutside);
  });
}
