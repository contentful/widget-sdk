import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouteType } from './routes';
import { router } from './useRouter';

export type RouteNavigateFn = (
  route: RouteType | 'string',
  options?: {
    replace?: boolean;
    state?: object | null;
  }
) => void;

export function useRouteNavigate() {
  const navigate = useNavigate();

  const routeNavigate: RouteNavigateFn = useCallback(
    (route, options) => {
      if (typeof route === 'string') {
        navigate(route, options);
      } else {
        const href = router.href(route);
        const optionsWithState = {
          ...options,
          // @ts-expect-error mute potentially missing route.navigationState
          state: { ...route?.navigationState, ...options?.state },
        };
        navigate(href, optionsWithState);
      }
    },
    [navigate]
  );

  return routeNavigate;
}
