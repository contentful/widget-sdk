import React from 'react';
import { RouteProps } from './RouteProps';

const Route = React.createContext('');
type Props = React.PropsWithChildren<RouteProps>;

export const RouteProvider: React.FC<Props> = ({ children, ngStateUrl }) => {
  return <Route.Provider value={ngStateUrl}>{children}</Route.Provider>;
};

export const useRouteProvider = (): string => React.useContext(Route);
