import {
  spaceSettingsRoutes,
  accountSettingsRoutes,
  organizationSettingsRoutes,
  contentTypesRoutes,
  spacesRoutes,
  assetsRoutes,
} from './routes/';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
  OrganizationSettingsRouteType,
  ContentTypesRouteType,
  SpacesRouteType,
  AssetsRouteType,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
  ...contentTypesRoutes,
  ...spacesRoutes,
  ...assetsRoutes,
};

type RouteType =
  | SpaceSettingsRouteType
  | AccountSettingsRouteType
  | OrganizationSettingsRouteType
  | ContentTypesRouteType
  | SpacesRouteType
  | AssetsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
