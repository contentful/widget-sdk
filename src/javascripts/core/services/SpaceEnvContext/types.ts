export interface SpaceEnvContextValue {
  currentSpace?: SpaceEnv;
  currentSpaceId?: string;
  currentSpaceName?: string;
  currentSpaceData?: SpaceData;
  currentEnvironment?: Environment;
  currentEnvironmentId?: string;
  currentEnvironmentName?: string;
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
  type: string;
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
  trialPeriodEndsAt: unknown; // TODO: Confirm type
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
  aliasId: unknown; // TODO: Confirm type
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
