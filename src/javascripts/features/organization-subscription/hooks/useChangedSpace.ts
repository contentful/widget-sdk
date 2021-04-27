import { useEffect, useState } from 'react';

/**
 * This hook is used to save the id of a space that was recently deleted or updated
 * with that information we create meaningfull feedback messages for the user about those space changes
 */
export function useChangedSpace() {
  const [changedSpaceId, setChangedSpaceId] = useState<string>();

  useEffect(() => {
    let timer;

    if (changedSpaceId) {
      timer = setTimeout(() => {
        setChangedSpaceId(undefined);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [changedSpaceId]);

  return { changedSpaceId, setChangedSpaceId };
}
