import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

import { beginSpaceCreation } from './CreateSpace';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import {
  getSpaceRatePlans,
  isEnterprisePlan,
  isSelfServicePlan,
  getBasePlan,
} from 'account/pricing/PricingDataProvider';
import { go } from 'states/Navigator';
import { getOrganization } from 'services/TokenStore';
import { isSpacePurchaseFlowAllowed } from 'features/space-purchase';

const mockV1Org = { sys: { id: 'v1' }, pricingVersion: 'pricing_version_1' };
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
  getOrganization: jest.fn(async () => mockV1Org),
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
jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));
jest.mock('features/space-purchase/utils/isSpacePurchaseFlowAllowed', () => ({
  isSpacePurchaseFlowAllowed: jest.fn(() => false),
}));
jest.mock('account/pricing/PricingDataProvider', () => ({
  getSpaceRatePlans: jest.fn(() => mockRatePlans),
  isEnterprisePlan: jest.fn(() => false),
  isSelfServicePlan: jest.fn(() => false),
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
    it('opens old dialog with v1 org id', async function () {
      await beginSpaceCreation('v1');
      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });

    it('opens wizard with v2 org id', async function () {
      await beginSpaceCreation('v2');
      getOrganization.mockResolvedValueOnce(mockV2Org);
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
      await beginSpaceCreation('v1');
      expect(canCreateSpaceInOrganization).toHaveBeenCalledWith('v1');
    });

    it('sends user to /new_space for self_service and free orgs', async function () {
      getOrganization.mockResolvedValueOnce(mockV2Org);
      getBasePlan.mockResolvedValueOnce({ customerType: 'Self-service' });
      isSelfServicePlan.mockResolvedValueOnce(true);
      isSpacePurchaseFlowAllowed.mockResolvedValueOnce(true);
      await beginSpaceCreation('v2');

      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organizations', 'new_space'],
        params: { orgId: 'v2' },
        options: { reload: true },
      });
    });

    it('opens the enterprise dialog for enterprise orgs', async function () {
      getSpaceRatePlans.mockResolvedValueOnce([mockRatePlans.enterprise]);
      getBasePlan.mockResolvedValueOnce({ customerType: 'Enterprise' });
      isEnterprisePlan.mockReturnValueOnce(true);
      await beginSpaceCreation('v2');
      getOrganization.mockResolvedValueOnce(mockV2Org);
      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });
  });
});
