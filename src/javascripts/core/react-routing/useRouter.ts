import { getModule } from 'core/NgRegistry';

import * as Navigator from 'states/Navigator';

import { RouteType, routes } from './routes';

export function useRouteState(route: RouteType) {
  const { path: routePath, ...routeRest } = route;
  const $stateParams = getModule('$stateParams');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = routes[routePath](
    { withEnvironment: Boolean($stateParams.environmentId) },
    routeRest as any
  );
  return { state };
}

export function getRouter() {
  return {
    go: (route: RouteType, options?: { [key: string]: any }) => {
      const $stateParams = getModule('$stateParams');
      const { path: routePath, ...routeRest } = route;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = routes[routePath](
        { withEnvironment: Boolean($stateParams.environmentId) },
        routeRest as any
      );
      return Navigator.go({
        path: state.path,
        params: state.params,
        options,
      });
    },
    href: (route: RouteType) => {
      const $stateParams = getModule('$stateParams');
      const { path: routePath, ...routeRest } = route;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = routes[routePath](
        { withEnvironment: Boolean($stateParams.environmentId) },
        routeRest as any
      );
      return window.decodeURIComponent(
        Navigator.href({
          path: state.path,
          params: state.params,
        })
      );
    },
  };
}
