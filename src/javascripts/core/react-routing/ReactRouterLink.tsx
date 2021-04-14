import React from 'react';
import { StateLink } from 'app/common/StateLink';
import type { StateLinkProps } from 'app/common/StateLink';

import { RouteType } from './routes';
import { useRouteState } from './useRouter';

export const ReactRouterLink = (
  props: { route: RouteType } & Omit<StateLinkProps, 'path' | 'params'>
) => {
  const { route, ...rest } = props;
  const { state } = useRouteState(route);
  return (
    <StateLink
      {...rest}
      {...state}
      params={{
        navigationState: null,
        ...state.params,
      }}
    />
  );
};
