import { spaceSettingsRoutes, accountSettingsRoutes, organizationSettingsRoutes } from './routes/';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
  OrganizationSettingsRouteType,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
};

type RouteType = SpaceSettingsRouteType | AccountSettingsRouteType | OrganizationSettingsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
