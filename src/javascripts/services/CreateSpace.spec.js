import { ModalLauncher } from '@contentful/forma-36-react-components';

import { beginSpaceCreation } from './CreateSpace';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { isEnterprisePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { getVariation, FLAGS } from 'core/feature-flags';
import { getSpaceProductRatePlans, getBasePlan } from 'features/pricing-entities';
import { router } from 'core/react-routing';

const mockV2Org = { sys: { id: 'v2' }, pricingVersion: 'pricing_version_2' };

const mockRatePlans = {
  enterprise: {
    productPlanType: 'free_space',
    productType: 'committed',
  },
  onDemand: {
    productPlanType: 'free_space',
    productType: 'on_demand',
  },
};

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(async () => mockV2Org),
}));
jest.mock('access_control/AccessChecker', () => ({
  canCreateSpaceInOrganization: jest.fn().mockReturnValue(true),
}));
jest.mock('services/ResourceService', () => ({
  get: jest.fn().mockResolvedValue({
    usage: 1,
    limits: {
      maximum: 5,
    },
  }),
}));

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(() => false),
  isSelfServicePlan: jest.fn(() => false),
  isFreePlan: jest.fn(() => false),
}));

jest.mock('features/pricing-entities', () => ({
  getSpaceProductRatePlans: jest.fn(),
  getBasePlan: jest.fn(() => ({ customerType: 'Self-service' })),
}));

// TODO: we'll be able to write much better tests if we migrate to Forma36 modals
describe('CreateSpace', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    ModalLauncher.open.mockClear();
  });

  describe('#beginSpaceCreation', () => {
    it('opens wizard with v2 org id', async function () {
      await beginSpaceCreation('v2');
      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });

    it('throws if no org id is passed', async function () {
      try {
        await beginSpaceCreation();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('checks for creation permission', async function () {
      canCreateSpaceInOrganization.mockReturnValueOnce(false);
      await beginSpaceCreation('v2');
      expect(canCreateSpaceInOrganization).toHaveBeenCalledWith('v2');
    });

    it('sends user to the new_space page for self_service and free orgs', async function () {
      getBasePlan.mockResolvedValueOnce({ customerType: 'Self-service' });
      isSelfServicePlan.mockResolvedValueOnce(true);
      await beginSpaceCreation('v2');

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'organizations.subscription.new_space',
        orgId: 'v2',
        navigationState: {},
      });
    });

    it('sends user to the new_space page with a custom route param', async function () {
      getBasePlan.mockResolvedValueOnce({ customerType: 'Self-service' });
      isSelfServicePlan.mockResolvedValueOnce(true);
      await beginSpaceCreation('v2', { customParam: 'foo' });

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'organizations.subscription.new_space',
        orgId: 'v2',
        navigationState: {
          customParam: 'foo',
        },
      });
    });

    it('opens the enterprise dialog for enterprise orgs when feature flag enabled is disabled', async function () {
      getVariation.mockReturnValue(false);
      getSpaceProductRatePlans.mockResolvedValueOnce([mockRatePlans.enterprise]);
      getBasePlan.mockResolvedValueOnce({ customerType: 'Enterprise' });
      isEnterprisePlan.mockReturnValueOnce(true);
      await beginSpaceCreation('v2');
      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });

    it('sends user to the space_create page for enterprise orgs when feature flag enabled', async function () {
      getSpaceProductRatePlans.mockResolvedValueOnce([mockRatePlans.enterprise]);
      getBasePlan.mockResolvedValueOnce({ customerType: 'Enterprise' });
      isEnterprisePlan.mockReturnValueOnce(true);
      getVariation.mockImplementation((flag) => {
        if (flag === FLAGS.CREATE_SPACE_FOR_SPACE_PLAN) {
          return Promise.resolve(true);
        }
      });

      await beginSpaceCreation('v2');

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'organizations.subscription.overview.create-space',
        orgId: 'v2',
      });
    });
  });
});
