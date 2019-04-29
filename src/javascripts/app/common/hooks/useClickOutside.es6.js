import { useEffect } from 'react';

export default function useClickOutside(ref, isActive, cb) {
  useEffect(() => {
    // run callback function if target is not inside ref
    const handleClickOutside = evt => {
      !ref.current.contains(evt.target) && cb();
    };

    if (isActive) {
      document.addEventListener('mouseup', handleClickOutside);
    } else {
      document.removeEventListener('mouseup', handleClickOutside);
    }

    // remove listener when the component is unmounted
    return () => document.removeEventListener('mouseup', handleClickOutside);
  });
}
