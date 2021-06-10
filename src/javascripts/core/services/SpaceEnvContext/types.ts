import {
  EnvironmentProps as Environment,
  MetaLinkProps,
  ContentTypeProps,
} from 'contentful-management/types';
import type { Organization, SpaceObject, SpaceData } from 'classes/spaceContextTypes';

export type ContentType = ContentTypeProps;

export interface SpaceEnvContextValue {
  currentEnvironment?: Environment;
  currentEnvironmentAliasId?: string;
  currentEnvironmentId: string;
  currentResolvedEnvironmentId: string;
  currentEnvironmentName?: string;
  currentOrganization?: Organization;
  currentOrganizationId?: string;
  currentOrganizationName?: string;
  currentSpace?: SpaceObject;
  currentSpaceData?: SpaceData;
  currentSpaceEnvironments?: Environment[];
  currentSpaceId?: string;
  currentSpaceName?: string;
  documentPool?: any;
  resources?: any;
}

export interface ContentTypeField {
  apiName: string;
  disabled: boolean;
  id: string;
  localized: boolean;
  name: string;
  omitted: boolean;
  required: boolean;
  type: string;
  validations: ContentTypeValidation[];
}

export type ContentTypeValidation = Record<string, unknown>;

export type ContentTypeSys = ContentType['sys'];

export interface Sys {
  type: string;
  id: string;
  version: number;
  createdBy: CreatedBy;
  createdAt: string;
  updatedBy: UpdatedBy;
  updatedAt: string;
}

export interface LinkSys {
  type: 'Link';
  id: string;
  linkType: string;
}

export interface CreatedBy {
  sys: LinkSys;
}

export interface UpdatedBy {
  sys: LinkSys;
}

export interface CurrentShard {
  state: string;
  shardId: number;
  sys: CurrentShardSys;
}

export interface CurrentShardSys extends Sys {
  type: string;
  id: string;
  version: number;
  space: MetaLinkProps;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceMembership {
  admin: boolean;
  sys: SpaceMembershipSys;
  user: User;
  roles: Role[];
}

export interface SpaceMembershipSys extends Sys {
  space: any;
  user: User;
}

export interface User {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  email: string;
  cookieConsentData: unknown; // TODO: Confirm type
  activated: boolean;
  signInCount: number;
  confirmed: boolean;
  '2faEnabled': boolean;
  intercomUserSignature: string;
  canCreateOrganization: boolean;
  features: Features;
  sys: Sys;
  organizationMemberships: OrganizationMembership[];
}

export interface Role {
  name: string;
  description: string | null;
  policies: unknown[]; // TODO: Confirm type
  permissions: Permissions;
  sys: any;
}

export interface Permissions {
  ContentType: string[];
  Settings: unknown[]; // TODO: Confirm type
  ApiKey: unknown[]; // TODO: Confirm type
  Environments: unknown[]; // TODO: Confirm type
  EnvironmentAliases: unknown[]; // TODO: Confirm type
  Tags: unknown[]; // TODO: Confirm type
}

export interface Features {
  logAnalytics: boolean;
  showPreview: boolean;
}

export interface OrganizationMembership {
  role: string;
  sys: OrganizationMembershipSys;
  user: User;
  organization: Organization;
}

export interface OrganizationMembershipSys extends Sys {
  status: string;
  lastActiveAt: string;
  sso: unknown; // TODO: Confirm type
}

export interface SpaceMember {
  admin: boolean;
  sys: SpaceMemberSys;
  roles: Role[];
}

export interface SpaceMemberSys {
  type: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  space: any;
  user: User;
  relatedMemberships: RelatedMembership[];
}

export interface RelatedMembership {
  admin: boolean;
  sys: RelatedMembershipSys;
  user: User;
  roles: Role[];
}

export interface RelatedMembershipSys extends Sys {
  space: any;
  user: User;
}

export interface Shard {
  state: string;
  shardId: number;
  sys: ShardSys;
}

export interface ShardSys {
  type: string;
  id: string;
  version: number;
  space: any;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentMeta {
  environmentId: string;
  isMasterEnvironment: boolean;
  optedIn: boolean;
  aliasId?: string;
}

export interface Alias {
  sys: LinkSys;
}
