import * as modalDialogMocked from 'ng/modalDialog';

import { showDialog } from './CreateSpace';
import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import {
  getSpaceRatePlans,
  isEnterprisePlan,
  getBasePlan
} from 'account/pricing/PricingDataProvider';
import { getOrganization } from 'services/TokenStore';

const mockV1Org = { sys: { id: 'v1' }, pricingVersion: 'pricing_version_1' };
const mockV2Org = { sys: { id: 'v2' }, pricingVersion: 'pricing_version_2' };

const mockRatePlans = {
  enterprise: {
    productPlanType: 'free_space',
    productType: 'committed'
  },
  onDemand: {
    productPlanType: 'free_space',
    productType: 'on_demand'
  }
};

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(async () => mockV1Org)
}));
jest.mock('access_control/AccessChecker', () => ({
  canCreateSpaceInOrganization: jest.fn().mockReturnValue(true)
}));
jest.mock('services/ResourceService', () => ({
  get: jest.fn().mockResolvedValue({
    usage: 1,
    limits: {
      maximum: 5
    }
  })
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSpaceRatePlans: jest.fn(() => mockRatePlans),
  isEnterprisePlan: jest.fn(() => false),
  getBasePlan: jest.fn(() => ({ customerType: 'Self-service' }))
}));

jest.mock('ng/modalDialog', () => ({
  open: jest.fn().mockResolvedValue({})
}));

// TODO: we'll be able to write much better tests if we migrate to Forma36 modals
describe('CreateSpace', () => {
  beforeEach(() => {
    modalDialogMocked.open.mockClear();
  });

  describe('#showDialog', () => {
    it('opens old dialog with v1 org id', async function() {
      await showDialog('v1');
      expect(modalDialogMocked.open).toHaveBeenCalledTimes(1);
    });

    it('opens wizard with v2 org id', async function() {
      await showDialog('v2');
      getOrganization.mockResolvedValueOnce(mockV2Org);
      expect(modalDialogMocked.open).toHaveBeenCalledTimes(1);
    });

    it('throws if no org id is passed', async function() {
      try {
        await showDialog();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('checks for creation permission', async function() {
      canCreateSpaceInOrganization.mockReturnValueOnce(false);
      await showDialog('v1');
      expect(canCreateSpaceInOrganization).toHaveBeenCalledWith('v1');
    });

    it('opens the enterprise dialog for enterprise orgs', async function() {
      getSpaceRatePlans.mockResolvedValueOnce([mockRatePlans.enterprise]);
      getBasePlan.mockResolvedValueOnce({ customerType: 'Enterprise' });
      isEnterprisePlan.mockReturnValueOnce(true);
      await showDialog('v2');
      getOrganization.mockResolvedValueOnce(mockV2Org);
      expect(modalDialogMocked.open).toHaveBeenCalledTimes(1);
    });
  });
});
