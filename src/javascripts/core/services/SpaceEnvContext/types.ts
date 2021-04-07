export interface SpaceEnvContextValue {
  currentEnvironment?: Environment;
  currentEnvironmentAliasId?: string;
  currentEnvironmentId: string;
  currentEnvironmentName?: string;
  currentOrganization?: Organization;
  currentOrganizationId?: string;
  currentOrganizationName?: string;
  currentSpace?: SpaceEnv;
  currentSpaceData?: SpaceData;
  currentSpaceEnvironments?: Environment[];
  currentSpaceId?: string;
  currentSpaceName?: string;
  currentSpaceContentTypes: ContentType[];
  currentUsers?: SpaceEnvUsers;
  documentPool?: any;
}

export interface SpaceEnvUsers {
  get: () => unknown;
  getAll: () => unknown;
}

export interface ContentType {
  description: string;
  displayField: string;
  fields: ContentTypeField[];
  name: string;
  sys: ContentTypeSys;
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

export interface ContentTypeSys {
  type: string;
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  environment: {
    sys: LinkSys;
  };
  space: {
    sys: LinkSys;
  };
}

export interface SpaceEnv {
  data: SpaceData;
  environment: Environment;
  environmentMeta: EnvironmentMeta;
  enforcements: Enforcements[];
}

export type Enforcements = unknown; // TODO: Confirm type

export interface SpaceData {
  name: string;
  activatedAt: unknown; // TODO: Confirm type
  readOnlyAt: string;
  trialPeriodEndsAt?: string;
  sys: SpaceDataSys;
  currentShard: CurrentShard;
  spaceMembership: SpaceMembership;
  spaceMember: SpaceMember;
  shards: Shard[];
  organization: Organization;
}

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

export interface SpaceDataSys extends Sys {
  organization: Organization;
}

export interface CreatedBy {
  sys: LinkSys;
}

export interface UpdatedBy {
  sys: LinkSys;
}

export interface Organization {
  name: string;
  subscriptionState: unknown; // TODO: Confirm type
  isBillable: boolean;
  trialPeriodEndsAt: string | null;
  cancellationActiveAt: unknown; // TODO: Confirm type
  hasSsoEnabled: boolean;
  sys: Sys;
  disableAnalytics: boolean;
  pricingVersion: string;
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
  space: SpaceData;
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
  space: SpaceData;
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
  sys: RoleSys;
}

export interface RoleSys extends Sys {
  space: SpaceData;
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
  space: SpaceData;
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
  space: SpaceData;
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
  space: SpaceData;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentMeta {
  environmentId: string;
  isMasterEnvironment: boolean;
  optedIn: boolean;
  aliasId?: string;
}

export interface Environment {
  name: string;
  sys: EnvironmentSys;
}

export interface Alias {
  sys: LinkSys;
}

export interface EnvironmentSys extends Sys {
  aliases: Alias[];
  space: {
    sys: LinkSys;
  };
  status: {
    sys: LinkSys;
  };
}
