import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { getBasePlan } from 'features/pricing-entities';
import type { BasePlan } from 'features/pricing-entities';

export async function isSpacePurchaseFlowAllowed(orgId: string): Promise<boolean> {
  const endpoint = createOrganizationEndpoint(orgId);
  const basePlan: BasePlan = await getBasePlan(endpoint);

  return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
}

export async function isSpacePurchaseFlowAllowedForChange(orgId: string): Promise<boolean> {
  const endpoint = createOrganizationEndpoint(orgId);
  const basePlan: BasePlan = await getBasePlan(endpoint);

  return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
}
