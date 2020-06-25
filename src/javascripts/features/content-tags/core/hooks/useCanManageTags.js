import { useMemo } from 'react';
import { useIsAdmin } from './useIsAdmin';
import { can, Action } from 'access_control/AccessChecker';

const useCanManageTags = () => {
  const isAdmin = useIsAdmin();
  const canManageTags = useMemo(() => {
    return isAdmin || can(Action.MANAGE, 'Tags');
  }, [isAdmin]);
  return canManageTags;
};

export { useCanManageTags };
