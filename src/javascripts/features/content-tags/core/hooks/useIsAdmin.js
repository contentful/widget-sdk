import { getModule } from 'core/NgRegistry';
import { useMemo } from 'react';

const useIsAdmin = () => {
  const isAdmin = useMemo(() => {
    const spaceContext = getModule('spaceContext');
    return !!spaceContext.getData('spaceMember.admin', false);
  }, []);
  return isAdmin;
};

export { useIsAdmin };
