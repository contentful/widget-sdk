import React from 'react';
import { Route as ReactRouterRoute } from 'react-router-dom';
import type { RouteProps } from 'react-router';
import { RouteNameCursor } from './RouteNameCursor';

export const Route = (props: RouteProps & { name: string | null }) => {
  const { name, ...rest } = props;
  React.useEffect(() => {
    if (name) {
      RouteNameCursor.setCurrentReactRouteName(name);
      return () => {
        RouteNameCursor.setCurrentReactRouteName(null);
      };
    }
  }, [name]);
  return <ReactRouterRoute {...rest} />;
};
