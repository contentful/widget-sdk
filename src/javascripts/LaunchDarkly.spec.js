import _ from 'lodash';
import moment from 'moment';
import ldClient from 'ldclient-js';
import { getVariation, clearCache } from './LaunchDarkly.es6';
import { getOrganization, getSpace, getUser } from 'services/TokenStore.es6';
import { launchDarkly } from 'Config.es6';
import getOrgStatus from 'data/OrganizationStatus.es6';
import { logError } from 'services/logger.es6';
import { isFlagOverridden, getFlagOverride } from 'debug/EnforceFlags.es6';

jest.mock('ldclient-js', () => ({
  initialize: jest.fn()
}));

jest.mock('data/User/index.es6', () => ({
  getOrgRole: jest.fn().mockReturnValue('org role'),
  getUserAgeInDays: jest.fn().mockReturnValue(7),
  hasAnOrgWithSpaces: jest.fn().mockReturnValue(false),
  ownsAtleastOneOrg: jest.fn().mockReturnValue(true),
  isAutomationTestUser: jest.fn().mockReturnValue(true),
  isUserOrgCreator: jest.fn().mockReturnValue(false),
  getUserCreationDateUnixTimestamp: jest.fn().mockReturnValue(1234567890),
  getUserSpaceRoles: jest.fn().mockReturnValue(['editor', 'translator3'])
}));

jest.mock('utils/ShallowObjectDiff.es6', () => jest.fn().mockReturnValue({}));

jest.mock('debug/EnforceFlags.es6', () => ({
  isFlagOverridden: jest.fn().mockReturnValue(false),
  getFlagOverride: jest.fn()
}));

jest.mock('services/TokenStore.es6', () => ({
  getOrganization: jest.fn(),
  getSpace: jest.fn(),
  getUser: jest.fn(),
  getSpacesByOrganization: jest.fn()
}));

jest.mock('data/OrganizationStatus.es6', () => jest.fn());

jest.mock('debug/EnforceFlags.es6', () => ({
  isFlagOverridden: jest.fn(),
  getFlagOverride: jest.fn()
}));

const organization = {
  name: 'Awesome Org',
  role: 'owner',
  pricingVersion: 'pricing_version_2',
  sys: {
    id: 'abcd_org'
  }
};

const space = {
  name: 'Awesome space',
  sys: {
    id: 'abcd_space'
  }
};

describe('LaunchDarkly', () => {
  let client;
  let variations;

  beforeEach(() => {
    variations = {};

    // This is a mock implementation of the LaunchDarkly client
    // library
    client = {
      waitForInitialization: jest.fn().mockResolvedValue(true),
      identify: jest.fn(),
      allFlags: jest.fn().mockImplementation(() => {
        return variations;
      })
    };

    ldClient.initialize.mockReturnValue(client);

    const user = {
      email: 'a',
      organizationMemberships: [organization],
      signInCount: 10,
      sys: {
        createdAt: moment()
          .subtract(7, 'days')
          .toISOString(),
        id: 'user-id-1'
      }
    };

    getUser.mockResolvedValue(user);
  });

  afterEach(() => {
    getOrganization.mockReset();
    getSpace.mockReset();
    getUser.mockReset();
    ldClient.initialize.mockReset();
    logError.mockReset();
    isFlagOverridden.mockReset();
    getFlagOverride.mockReset();

    clearCache();
  });

  describe('#getVariation', () => {
    beforeEach(() => {
      variations['FLAG'] = '"flag_value"';
      variations['OTHER_FLAG'] = '"other_flag_value"';
    });

    it('should return the overridden flag variation and not initialize if flag has override', async () => {
      isFlagOverridden.mockReturnValueOnce(true);
      getFlagOverride.mockReturnValueOnce('override-value');

      const variation = await getVariation('FLAG');

      expect(ldClient.initialize).not.toHaveBeenCalled();
      expect(isFlagOverridden).toHaveBeenCalledTimes(1);
      expect(variation).toBe('override-value');
    });

    it('should attempt to get the organization if provided org id', async () => {
      await getVariation('FLAG', { organizationId: 'org_1234' });

      expect(getOrganization).toHaveBeenCalledTimes(1);
      expect(getOrganization).toHaveBeenNthCalledWith(1, 'org_1234');
    });

    it('should attempt to get the space if provided spaceId', async () => {
      await getVariation('FLAG', { spaceId: 'space_1234' });

      expect(getSpace).toHaveBeenCalledTimes(1);
      expect(getSpace).toHaveBeenNthCalledWith(1, 'space_1234');
    });

    it('should attempt to get both org and space if provided both ids', async () => {
      await getVariation('FLAG', { organizationId: 'org_1234', spaceId: 'space_1234' });

      expect(getOrganization).toHaveBeenCalledTimes(1);
      expect(getOrganization).toHaveBeenNthCalledWith(1, 'org_1234');

      expect(getSpace).toHaveBeenCalledTimes(1);
      expect(getSpace).toHaveBeenNthCalledWith(1, 'space_1234');
    });

    it('should log and return undefined if given invalid org or space id', async () => {
      let variation;

      getOrganization.mockRejectedValueOnce(false);

      variation = await getVariation('FLAG', { organizationId: 'org_1234' });

      expect(variation).toBeUndefined();
      expect(logError).toHaveBeenCalledTimes(1);

      getSpace.mockRejectedValueOnce(false);

      variation = await getVariation('FLAG', { spaceId: 'space_1234' });

      expect(variation).toBeUndefined();
      expect(logError).toHaveBeenCalledTimes(2);
    });

    it('should only initialize once', async () => {
      await getVariation('FLAG', { organizationId: 'org_1234' });
      expect(ldClient.initialize).toHaveBeenCalledTimes(1);

      await getVariation('FLAG', { spaceId: 'space_1234' });
      expect(ldClient.initialize).toHaveBeenCalledTimes(1);
    });

    it('should be able to get two different flag values', async () => {
      expect(await getVariation('FLAG')).toBe('flag_value');
      expect(await getVariation('OTHER_FLAG')).toBe('other_flag_value');
    });

    it('should only identify once per orgId/spaceId combo', async () => {
      await getVariation('FLAG', { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation('FLAG', { organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(1);

      await getVariation('FLAG', { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);

      await getVariation('FLAG', { spaceId: 'space_1234' });
      expect(client.identify).toHaveBeenCalledTimes(2);

      await getVariation('FLAG', { spaceId: 'space_1234', organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(3);

      await getVariation('FLAG', { spaceId: 'space_1234', organizationId: 'org_1234' });
      expect(client.identify).toHaveBeenCalledTimes(3);
    });

    it('should return undefined if the flag does not have a variation/does not exist', async () => {
      const variation = await getVariation('UNKNOWN_FLAG');

      expect(variation).toBeUndefined();
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if the flag variation is invalid JSON', async () => {
      variations['FLAG'] = '{invalid_json"';

      const variation = await getVariation('FLAG');

      expect(variation).toBeUndefined();
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it('should initially include user data in ldUser value', async () => {
      await getVariation('FLAG');

      expect(ldClient.initialize).toHaveBeenCalledTimes(1);
      expect(ldClient.initialize).toHaveBeenNthCalledWith(1, launchDarkly.envId, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          currentUserSpaceRole: [],
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: 1234567890
        }
      });
    });

    it('should provide org data if given valid orgId', async () => {
      getOrganization.mockResolvedValueOnce(organization);
      getOrgStatus.mockResolvedValueOnce({ isPaid: true, isEnterprise: true });

      await getVariation('FLAG', { organizationId: 'org_5678' });

      // Note a lot of this data is provided from functions in
      // data/User/index.es6
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
          currentUserCreationDate: 1234567890,

          currentOrgId: 'abcd_org',
          currentOrgPricingVersion: 'pricing_version_2',
          currentOrgPlanIsEnterprise: true,
          currentOrgHasSpace: false,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserIsCurrentOrgCreator: false,
          isNonPayingUser: false
        }
      });
    });

    it('should provide space data if given valid spaceId', async () => {
      getSpace.mockResolvedValueOnce(space);

      await getVariation('FLAG', { spaceId: 'space_5678' });

      // Note a lot of this data is provided from functions in
      // data/User/index.es6
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
          currentUserCreationDate: 1234567890,

          currentSpaceId: 'abcd_space',
          currentUserSpaceRole: ['editor', 'translator3']
        }
      });
    });

    it('should provide org and space data if given valid IDs', async () => {
      getOrganization.mockResolvedValueOnce(organization);
      getSpace.mockResolvedValueOnce(space);

      await getVariation('FLAG', { organizationId: 'org_5678', spaceId: 'space_5678' });

      expect(client.identify).toHaveBeenCalledTimes(1);
      expect(client.identify).toHaveBeenNthCalledWith(1, {
        key: 'user-id-1',
        custom: {
          currentUserSignInCount: 10,
          isAutomationTestUser: true,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          currentUserCreationDate: 1234567890,

          currentOrgId: 'abcd_org',
          currentOrgPricingVersion: 'pricing_version_2',
          currentOrgPlanIsEnterprise: false,
          currentOrgHasSpace: false,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserIsCurrentOrgCreator: false,
          isNonPayingUser: true,

          currentSpaceId: 'abcd_space',
          currentUserSpaceRole: ['editor', 'translator3']
        }
      });
    });
  });
});
