import { spaceSettingsRoutes, accountSettingsRoutes } from './routes/index';
import type {
  SpaceSettingsRouteType,
  AccountSettingsRouteType,
  CreateRouteDefinition,
  RouteDefinition,
} from './routes/index';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
};

type RouteType = SpaceSettingsRouteType | AccountSettingsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
