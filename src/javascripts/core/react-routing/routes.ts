import {
  spaceSettingsRoutes,
  accountSettingsRoutes,
  organizationSettingsRoutes,
  contentTypesRoutes,
} from './routes/';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
  OrganizationSettingsRouteType,
  ContentTypesRouteType,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
  ...contentTypesRoutes,
};

type RouteType =
  | SpaceSettingsRouteType
  | AccountSettingsRouteType
  | OrganizationSettingsRouteType
  | ContentTypesRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
