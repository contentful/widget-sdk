export type RouteDefinition = {
  path: string | string[];
  params?: { [key: string]: unknown };
};

export type EnvironmentParams = { withEnvironment: boolean };
export type CreateRouteDefinition = (envParams: EnvironmentParams, params?: any) => RouteDefinition;
