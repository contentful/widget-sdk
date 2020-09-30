import { getBasePlan, isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { mockEndpoint } from '__mocks__/data/EndpointFactory';
import { getVariation } from 'LaunchDarkly';

import { isSpacePurchaseFlowAllowed } from './isSpacePurchaseFlowAllowed';

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(() => mockEndpoint),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isFreePlan: jest.fn(() => false),
  isSelfServicePlan: jest.fn(() => false),
  getBasePlan: jest.fn(() => ({ customerType: 'Self-service' })),
}));

describe('isSpacePurchaseFlowAllowed', () => {
  beforeEach(() => {
    getVariation.mockClear().mockResolvedValue(true);
  });

  it('returns true when feature flag is on and org is self-service', async function () {
    isSelfServicePlan.mockResolvedValueOnce(true);
    const result = await isSpacePurchaseFlowAllowed();
    expect(result).toEqual(true);
  });

  it('returns true when feature flag is on and org is free', async function () {
    getBasePlan.mockResolvedValueOnce({ customerType: 'Free' });
    isFreePlan.mockResolvedValue(true);
    const result = await isSpacePurchaseFlowAllowed();
    expect(result).toEqual(true);
  });

  it('returns false when feature flag is off', async function () {
    getVariation.mockResolvedValueOnce(false);
    const result = await isSpacePurchaseFlowAllowed();
    expect(result).toEqual(false);
  });
});
