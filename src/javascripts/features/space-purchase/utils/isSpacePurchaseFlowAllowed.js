import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getBasePlan, isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';

export async function isSpacePurchaseFlowAllowed(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  const basePlan = await getBasePlan(endpoint);

  return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
}

export async function isSpacePurchaseFlowAllowedForChange(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  const basePlan = await getBasePlan(endpoint);

  return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
}
