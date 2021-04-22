import { spaceSettingsRoutes, accountSettingsRoutes } from './routes/';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
};

type RouteType = SpaceSettingsRouteType | AccountSettingsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
