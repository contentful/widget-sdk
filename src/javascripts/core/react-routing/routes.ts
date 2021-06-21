import {
  spaceSettingsRoutes,
  accountSettingsRoutes,
  organizationSettingsRoutes,
  contentTypesRoutes,
  spacesRoutes,
  assetsRoutes,
  invitationRoutes,
  errorPageRoutes,
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
  ErrorPageRouteType,
} from './routes/';

const routes = {
  ...spaceSettingsRoutes,
  ...accountSettingsRoutes,
  ...organizationSettingsRoutes,
  ...contentTypesRoutes,
  ...spacesRoutes,
  ...assetsRoutes,
  ...invitationRoutes,
  ...errorPageRoutes,
};

type RouteType =
  | SpaceSettingsRouteType
  | AccountSettingsRouteType
  | OrganizationSettingsRouteType
  | ContentTypesRouteType
  | SpacesRouteType
  | AssetsRouteType
  | InvitationsRouteType
  | ErrorPageRouteType;

export { routes };

export type { RouteType, CreateRouteDefinition, RouteDefinition };
