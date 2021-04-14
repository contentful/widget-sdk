import React from 'react';
import { useRouteState } from './useRouter';
import { StateRedirect, StateRedirectProps } from 'app/common/StateRedirect';

import { RouteType } from './routes';

export const ReactRouterRedirect = (
  props: { route: RouteType } & Omit<StateRedirectProps, 'path' | 'params'>
) => {
  const { route, ...rest } = props;
  const { state } = useRouteState(route);
  return (
    <StateRedirect
      {...rest}
      {...state}
      params={{
        navigationState: null,
        ...state.params,
      }}
    />
  );
};
