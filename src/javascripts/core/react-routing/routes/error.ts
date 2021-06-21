export type ErrorPageRouteType = { path: 'error' };

export const routes = {
  error: () => ({
    path: 'error',
    params: {
      pathname: '/',
    },
  }),
};
