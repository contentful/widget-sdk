import { spaceSettingsRoutes, accountSettingsRoutes, organizationSettingsRoutes } from './routes/';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  OrganizationSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
};

type RouteType = SpaceSettingsRouteType | AccountSettingsRouteType | OrganizationSettingsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
