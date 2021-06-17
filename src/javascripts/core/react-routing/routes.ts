import {
  spaceSettingsRoutes,
  accountSettingsRoutes,
  organizationSettingsRoutes,
  contentTypesRoutes,
  spacesRoutes,
  assetsRoutes,
  invitationRoutes,
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
  InvitationsRouteType,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
  ...contentTypesRoutes,
  ...spacesRoutes,
  ...assetsRoutes,
  ...invitationRoutes,
};

type RouteType =
  | SpaceSettingsRouteType
  | AccountSettingsRouteType
  | OrganizationSettingsRouteType
  | ContentTypesRouteType
  | SpacesRouteType
  | AssetsRouteType
  | InvitationsRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
