import { useMemo } from 'react';
import { useIsAdmin } from './useIsAdmin';
import { Action, can } from 'access_control/AccessChecker';

const useCanManageTags = (): boolean => {
  const isAdmin = useIsAdmin();
  const canManageTags = useMemo(() => {
    return isAdmin || can(Action.MANAGE, 'Tags');
  }, [isAdmin]);
  return canManageTags;
};

export { useCanManageTags };
