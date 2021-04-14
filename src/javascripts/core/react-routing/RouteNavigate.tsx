import { useEffect } from 'react';
import { RouteType } from './routes';

import { useRouteNavigate } from './useRouteNavigate';

export function RouteNavigate({
  route,
  replace,
  state,
}: {
  route: RouteType;
  replace?: boolean;
  state?: object | null;
}): null {
  const navigate = useRouteNavigate();
  useEffect(() => {
    navigate(route, { replace, state });
  });

  return null;
}
