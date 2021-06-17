import { SpaceEndpoint } from 'data/CMA/types';
import APIClient from 'data/APIClient';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import * as MembershipRepo from 'access_control/SpaceMembershipRepository';
import createResourceService from 'services/ResourceService';
import { PubSubClient } from 'services/PubSubService';
import createUiConfigStore from 'data/UiConfig/Store';
import {
  EnvironmentProps as Environment,
  ContentTypeProps,
  BasicMetaSysProps,
  EnvironmentAliasProps,
  MetaSysProps,
  Space,
  OrganizationMembershipProps,
  SpaceMembershipProps,
} from 'contentful-management/types';

export type SpaceMember = {
  /**
   * User is an admin
   */
  admin: boolean;
  /**
   * Array of Role Links
   */
  roles: { name: string; description: string | null }[];

  sys: MetaSysProps & {
    user: {
      sys: {
        id: string;
      };
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string;
    };
  };
};

export interface SpaceData {
  name: string;
  activatedAt: string;
  readOnlyAt: string;
  sys: Space['sys'];
  currentShard: any;
  spaceMembership: SpaceMembershipProps;
  spaceMember: SpaceMember;
  shards: any[];
  organization: Organization;
}

interface EnvironmentMeta {
  environmentId: string;
  isMasterEnvironment: boolean;
  optedIn: boolean;
  aliasId?: string;
}

export interface SpaceObject {
  data: SpaceData;
  environment: Environment;
  environmentMeta: EnvironmentMeta;
  persistenceContext: any;
  enforcements: any;
  resources: any[];

  getId(): string;

  getContentType(contentTypeId: string): Promise<{ data: ContentTypeProps }>;
  newContentType(contentType: {
    sys: Partial<ContentTypeProps['sys']>;
    fields: ContentTypeProps['fields'];
  }): Promise<{ data: ContentTypeProps }>;

  getEntries(query: { content_type?: string; limit?: number }): Promise<{ total: number }>;
}

export type Enforcements = unknown; // TODO: Confirm type

export type Resources = ReturnType<typeof createResourceService>;

export type SpaceContextType = {
  cma: APIClient;
  endpoint: SpaceEndpoint;
  uiConfig: ReturnType<typeof createUiConfigStore> | null;
  space: SpaceObject;
  users: null | {
    get: (id: string) => unknown;
    getAll: () => unknown;
  };
  user: User;
  organization: Organization;
  docPool: {
    get: Function;
    destroy: Function;
    getById: Function;
  } | null;
  resettingSpace: boolean;
  aliases: EnvironmentAliasProps[];
  environments: Environment[];
  memberships: ReturnType<typeof MembershipRepo.create>;
  members: ReturnType<typeof createSpaceMembersRepo>;
  spaceResources: Resources | null;
  environmentResources: Resources | null;
  pubsubClient: PubSubClient;
  publishedCTs: {
    items$: any;
    refresh: () => Promise<void>;
    getAllBare: () => any[];
    get: (contentTypeId: string) => ContentTypeProps | null;
    publish: (contentType: ContentTypeProps) => Promise<ContentTypeProps>;
    unpublish: (contentType: ContentTypeProps) => Promise<ContentTypeProps>;
  };

  /**
   * Returns nested value stored under `path` in current `space.data`.
   * If not found, returns `defaultValue` (`undefined` when not provided)
   * @deprecated
   */
  getData: (path: string, defaultValue?: any) => any;

  getSpace: () => SpaceObject;
  /**
   * This method resets a space context with a given space.
   * It requires an API space object. Internally we create contentful/client instance.
   *
   * The returned promise resolves when all additional space
   * resources have been fetched (environments, locales, content types).
   *
   * @param [uriEnvOrAliasId] environment id based on the uri
   */
  resetWithSpace: (spaceData: any, uriEnvOrAliasId?: string) => Promise<SpaceContextType>;

  /**
   * This method purges a space context, so it doesn't contain space any longer
   */
  purge: () => void;

  /**
   * Returns ID of current space, if set
   */
  getId: () => string | undefined;

  /**
   * Returns the current environment ID, defaulting to `master`.
   * Returns `undefined` if no space is set.
   */
  getEnvironmentId: () => string | undefined;

  /**
   * Returns the current alias ID, if the user is accessing an alias
   */
  getAliasId: () => string | undefined;

  /**
   * Returns whether the current environment is aliased to 'master'
   * or is 'master'
   * Returns true for an environment object with a re-written sys.id of
   * 'master' (aka the environment as accessed via it's alias)
   */
  isMasterEnvironment: (environment?: Pick<Environment, 'sys'>) => boolean;

  isMasterEnvironmentById: (environmentId: string) => boolean;

  /**
   * Returns the ids of the environments aliases referencing the current environment
   */
  getAliasesIds: (environment?: Pick<Environment, 'sys'>) => string[];

  /**
   * Checks if the space is opted in to the environment alias feature
   */
  hasOptedIntoAliases: (environments?: Array<Pick<Environment, 'sys'>>) => boolean;
};

export interface User {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  email: string;
  cookieConsentData: string;
  activated: boolean;
  signInCount: number;
  confirmed: boolean;
  '2faEnabled': boolean;
  intercomUserSignature: string;
  canCreateOrganization: boolean;
  features: {
    logAnalytics: boolean;
    showPreview: boolean;
  };
  sys: BasicMetaSysProps;
  organizationMemberships: OrganizationMembershipProps[];
}

export interface Organization {
  name: string;
  subscriptionState: unknown; // TODO: Confirm type
  isBillable: boolean;
  trialPeriodEndsAt: string | null;
  cancellationActiveAt: unknown; // TODO: Confirm type
  hasSsoEnabled: boolean;
  sys: BasicMetaSysProps & {
    _v1Migration?: V1Migration;
  };
  disableAnalytics: boolean;
  pricingVersion: string;
}

export enum v1migrationDestinationNames {
  V1_DESTINATION_COMMUNITY = 'community',
  V1_DESTINATION_TEAM = 'team',
  V1_DESTINATION_PRO_BONO = 'pro_bono',
  V1_DESTINATION_PARTNER = 'partner',
}

export interface V1Migration {
  destination: v1migrationDestinationNames;
  status: string;
  plannedMigrationDate: string;
}
