import { noop } from 'lodash';
import ldClient from 'ldclient-js';
import { getVariation, reset, FLAGS, getVariationSync, hasCachedVariation } from './LaunchDarkly';
import { getOrganization, getSpace, getUser } from 'services/TokenStore';
import { launchDarkly } from 'Config';
import { captureError } from 'core/monitoring';
import { isFlagOverridden, getFlagOverride } from 'debug/EnforceFlags';
import * as DegradedAppPerformance from 'core/services/DegradedAppPerformance';

jest.mock('ldclient-js', () => ({
  initialize: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true),
  OrganizationFeatures: {
    SELF_CONFIGURE_SSO: 'self_configure_sso',
  },
}));

jest.mock('data/User', () => ({
  getOrgRole: jest.fn().mockReturnValue('org role'),
  getUserAgeInDays: jest.fn().mockReturnValue(7),
  hasAnOrgWithSpaces: jest.fn().mockReturnValue(false),
  ownsAtleastOneOrg: jest.fn().mockReturnValue(true),
  isAutomationTestUser: jest.fn().mockReturnValue(true),
  isUserOrgCreator: jest.fn().mockReturnValue(false),
  getUserCreationDateUnixTimestamp: jest.fn().mockReturnValue(1234567890),
  getUserSpaceRoles: jest.fn().mockReturnValue(['editor', 'translator3']),
}));

jest.mock('debug/EnforceFlags', () => ({
  isFlagOverridden: jest.fn().mockReturnValue(false),
  getFlagOverride: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
  getSpace: jest.fn(),
  getUser: jest.fn(),
  getSpacesByOrganization: jest.fn(),
}));

jest.mock('debug/EnforceFlags', () => ({
  isFlagOverridden: jest.fn(),
  getFlagOverride: jest.fn(),
}));

const orgCreationDate = new Date(2018, 12, 25);
const userCreationDate = new Date(2018, 12, 25);

const organization = {
  name: 'Awesome Org',
  role: 'owner',
  pricingVersion: 'pricing_version_2',
  hasSsoEnabled: true,
  sys: {
    id: 'abcd_org',
    createdAt: orgCreationDate.toISOString(),
  },
};

const space = {
  name: 'Awesome space',
  sys: {
    id: 'abcd_space',
  },
};

describe('LaunchDarkly', () => {
  let client;
  let variations;

  beforeEach(() => {
    variations = {};

    // This is a mock implementation of the LaunchDarkly client
    // library
    client = {
      waitForInitialization: jest.fn().mockResolvedValue(null),
      identify: jest.fn().mockImplementation(async () => {
        return variations;
      }),
      variation: jest.fn((key, fallback) => {
        if (variations[key]) {
          return variations[key];
        } else {
          return fallback;
        }
      }),
    };

    (ldClient.initialize as jest.Mock).mockReturnValue(client);

    const user = {
      email: 'a',
      organizationMemberships: [organization],
      signInCount: 10,
      sys: {
        createdAt: userCreationDate.toISOString(),
        id: 'user-id-1',
      },
    };

    (getUser as jest.Mock).mockResolvedValue(user);
    (getOrganization as jest.Mock).mockResolvedValue(organization);
    (getSpace as jest.Mock).mockResolvedValue(space);

    jest.spyOn(DegradedAppPerformance, 'trigger').mockImplementation(noop);
  });

  afterEach(() => {
    (getOrganization as jest.Mock).mockReset();
    (getSpace as jest.Mock).mockReset();
    (getUser as jest.Mock).mockReset();
    (ldClient.initialize as jest.Mock).mockReset();
    (isFlagOverridden as jest.Mock).mockReset();
    (getFlagOverride as jest.Mock).mockReset();

    (DegradedAppPerformance.trigger as jest.Mock).mockRestore();

    reset();
  });

  describe('#getVariation', () => {
    beforeEach(() => {
      variations[FLAGS.__FLAG_FOR_UNIT_TESTS__] = '"test_flag_variation"';
      variations[FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__] = '"test_flag_variation_2"';
    });

    it('should return the overridden flag variation and not initialize if flag has an override', async () => {
      (isFlagOverridden as jest.Mock).mockReturnValueOnce(true);
      (getFlagOverride as jest.Mock).mockReturnValueOnce('override-value');

      const variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);

      expect(ldClient.initialize).not.toHaveBeenCalled();
      expect(isFlagOverridden).toHaveBeenCalledTimes(1);
      expect(variation).toBe('override-value');
    });

    it('should only initialize once', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(ldClient.initialize).toHaveBeenCalledTimes(1);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, { spaceId: 'space_1234' });
      expect(ldClient.initialize).toHaveBeenCalledTimes(1);
    });

    it('should log and return undefined if the flag does not exist in the map', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variation = await getVariation('UNKNOWN_FLAG' as unknown as any);

      expect(variation).toBeUndefined();
      expect(captureError).toHaveBeenCalledTimes(1);
    });

    it('should return the fallback value if waitForInitialization throws', async () => {
      client.waitForInitialization.mockRejectedValueOnce();

      // First time rejects, we get the fallback value
      expect(await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__)).toBe('fallback-value');

      // Second time resolves, we get the actual variation
      expect(await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__)).toBe('test_flag_variation');
    });

    it('should trigger the DegradedAppPerformance service if waitForInitialization throws', async () => {
      client.waitForInitialization.mockRejectedValueOnce();

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);

      expect(DegradedAppPerformance.trigger).toHaveBeenCalledWith('LaunchDarkly');
    });

    it('should be able to get two different flag values', async () => {
      expect(await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__)).toBe('test_flag_variation');
      expect(await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__)).toBe('test_flag_variation_2');
    });

    it('should attempt to get the organization if provided org id', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });

      expect(getOrganization).toHaveBeenCalledTimes(1);
      expect(getOrganization).toHaveBeenNthCalledWith(1, 'org_1234');
    });

    it('should attempt to get the space if provided space id', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_1234' });

      expect(getSpace).toHaveBeenCalledTimes(1);
      expect(getSpace).toHaveBeenNthCalledWith(1, 'space_1234');
    });

    it('should attempt to get both org and space if provided both ids', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, {
        organizationId: 'org_1234',
        spaceId: 'space_1234',
      });

      expect(getOrganization).toHaveBeenCalledTimes(1);
      expect(getOrganization).toHaveBeenNthCalledWith(1, 'org_1234');

      expect(getSpace).toHaveBeenCalledTimes(1);
      expect(getSpace).toHaveBeenNthCalledWith(1, 'space_1234');
    });

    it('should only identify once per flag/orgId/spaceId combo', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, {
        spaceId: 'space_1234',
        organizationId: 'org_1234',
      });
      expect(client.identify).toHaveBeenCalledTimes(3);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, {
        spaceId: 'space_1234',
        organizationId: 'org_1234',
      });
      expect(client.identify).toHaveBeenCalledTimes(3);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(4);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(4);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, {
        organizationId: 'org_1234',
        spaceId: 'space_1234',
      });
      expect(client.identify).toHaveBeenCalledTimes(5);
    });

    it('should only identify if the current user has changed', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation(FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__, { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);
    });

    it('should log and return the fallback if identify rejects', async () => {
      client.identify.mockRejectedValueOnce();

      const variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, {
        organizationId: 'org_1234',
      });

      expect(variation).toBe('fallback-value');
      expect(captureError).toHaveBeenCalledTimes(1);
    });

    it('should log and return the fallback if given invalid org or space id', async () => {
      let variation;

      (getOrganization as jest.Mock).mockRejectedValueOnce(false);

      variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });

      expect(variation).toBe('fallback-value');
      expect(captureError).toHaveBeenCalledTimes(1);

      (getSpace as jest.Mock).mockRejectedValueOnce(false);

      variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_1234' });

      expect(variation).toBe('fallback-value');
      expect(captureError).toHaveBeenCalledTimes(2);
    });

    it('should log and return the fallback value if the flag variation is invalid JSON', async () => {
      variations[FLAGS.__FLAG_FOR_UNIT_TESTS__] = '{invalid_json"';

      const variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);

      expect(variation).toBe('fallback-value');
      expect(captureError).toHaveBeenCalledTimes(1);
    });

    it('should trigger the DegradedAppPerformance service if the variation throws', async () => {
      client.identify.mockRejectedValueOnce();

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });

      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(1);
      expect(DegradedAppPerformance.trigger).toHaveBeenNthCalledWith(1, 'LaunchDarkly');

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(1);

      reset(); // reset cache

      (getOrganization as jest.Mock).mockRejectedValueOnce(false);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(2);
      expect(DegradedAppPerformance.trigger).toHaveBeenNthCalledWith(1, 'LaunchDarkly');

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(2);

      reset(); // reset cache

      variations[FLAGS.__FLAG_FOR_UNIT_TESTS__] = '{invalid_json"';

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(3);
      expect(DegradedAppPerformance.trigger).toHaveBeenNthCalledWith(1, 'LaunchDarkly');

      variations[FLAGS.__FLAG_FOR_UNIT_TESTS__] = '"hello world"';

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_1234' });
      expect(DegradedAppPerformance.trigger).toHaveBeenCalledTimes(3);
    });

    it('should initially include user data in ldUser value', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);

      expect(ldClient.initialize).toHaveBeenCalledTimes(1);
      expect(ldClient.initialize).toHaveBeenNthCalledWith(1, launchDarkly.envId, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          currentUserSpaceRole: [],
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: userCreationDate.getTime(),
          currentUserIsFromContentful: false,
        },
      });
    });

    it('should provide org data if given valid orgId', async () => {
      (getOrganization as jest.Mock).mockResolvedValueOnce(organization);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { organizationId: 'org_5678' });

      // Note a lot of this data is provided from functions in
      // data/User/index
      //
      // See the mocked functions above
      expect(client.identify).toHaveBeenCalledTimes(1);
      expect(client.identify).toHaveBeenNthCalledWith(1, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          currentUserSpaceRole: [],
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: userCreationDate.getTime(),
          currentUserIsFromContentful: false,
          currentOrgCreationDate: orgCreationDate.getTime(),
          currentOrgId: 'abcd_org',
          currentOrgPricingVersion: 'pricing_version_2',
          currentOrgHasSpace: false,
          currentOrgHasPaymentMethod: false,
          currentOrgHasSsoEnabled: true,
          currentOrgHasSsoSelfConfigFeature: true,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserIsCurrentOrgCreator: false,
          isNonPayingUser: true,
        },
      });
    });

    it('should provide space data if given valid spaceId', async () => {
      (getSpace as jest.Mock).mockResolvedValueOnce(space);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { spaceId: 'space_5678' });

      // Note a lot of this data is provided from functions in
      // data/User/index
      //
      // See the mocked functions above
      expect(client.identify).toHaveBeenCalledTimes(1);
      expect(client.identify).toHaveBeenNthCalledWith(1, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: userCreationDate.getTime(),
          currentUserIsFromContentful: false,

          currentSpaceId: 'abcd_space',
          currentUserSpaceRole: ['editor', 'translator3'],
        },
      });
    });

    it('should provide org and space data if given valid IDs', async () => {
      (getOrganization as jest.Mock).mockResolvedValueOnce(organization);
      (getSpace as jest.Mock).mockResolvedValueOnce(space);

      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, {
        organizationId: 'org_5678',
        spaceId: 'space_5678',
      });

      expect(client.identify).toHaveBeenCalledTimes(1);
      expect(client.identify).toHaveBeenNthCalledWith(1, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: userCreationDate.getTime(),
          currentUserIsFromContentful: false,
          currentOrgCreationDate: orgCreationDate.getTime(),
          currentOrgId: 'abcd_org',
          currentOrgPricingVersion: 'pricing_version_2',
          currentOrgHasSpace: false,
          currentOrgHasPaymentMethod: false,
          currentOrgHasSsoEnabled: true,
          currentOrgHasSsoSelfConfigFeature: true,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserIsCurrentOrgCreator: false,
          isNonPayingUser: true,

          currentSpaceId: 'abcd_space',
          currentUserSpaceRole: ['editor', 'translator3'],
        },
      });
    });

    it('should add the environment to the custom data if envId is provided', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__, { environmentId: 'env_id_1234' });

      expect(client.identify).toHaveBeenCalledTimes(1);
      expect(client.identify).toHaveBeenNthCalledWith(1, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          currentUserSpaceRole: [],
          currentSpaceEnvironmentId: 'env_id_1234',
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: userCreationDate.getTime(),
          currentUserIsFromContentful: false,
        },
      });
    });
  });

  describe('#getVariationSync', () => {
    it('fills up cache when calling getVariation', async () => {
      const variation = await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);
      expect(variation).toBe('fallback-value');
      expect(getVariationSync(FLAGS.__FLAG_FOR_UNIT_TESTS__)).toBe('fallback-value');
    });
  });

  describe('#hasCachedVariation', () => {
    it('returns false for not cached key', () => {
      const isCached = hasCachedVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);
      expect(isCached).toBeFalsy();
    });
    it('returns true for cached key', async () => {
      await getVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);
      const isCached = hasCachedVariation(FLAGS.__FLAG_FOR_UNIT_TESTS__);
      expect(isCached).toBeFalsy();
    });
  });
});
