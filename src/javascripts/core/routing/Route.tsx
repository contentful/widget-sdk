import * as React from 'react';
import { useRouteProvider } from './RouteProvider';

type Props = React.PropsWithChildren<{
  path: string;
}>;

const Route: React.FC<Props> = ({ path, children }) => {
  const currentPath = useRouteProvider();
  return currentPath === path ? <>{children}</> : null;
};

export { Route };
