import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getBasePlan, isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { getVariation, FLAGS } from 'LaunchDarkly';

export async function isSpacePurchaseFlowAllowed(orgId) {
  const isNewSpacePurchaseEnabled = await getVariation(FLAGS.NEW_PURCHASE_FLOW, {
    organizationId: orgId,
  });

  if (isNewSpacePurchaseEnabled) {
    const endpoint = createOrganizationEndpoint(orgId);
    const basePlan = await getBasePlan(endpoint);

    return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
  }

  return false;
}

export async function isSpacePurchaseFlowAllowedForChange(orgId) {
  const isNewSpacePurchaseEnabled = await getVariation(FLAGS.NEW_PURCHASE_FLOW, {
    organizationId: orgId,
  });
  const spacePurchaseFlowAllowedForPlanChange = await getVariation(
    FLAGS.SPACE_PLAN_CHANGE_NEW_PURCHASE_FLOW,
    {
      organizationId: orgId,
    }
  );

  if (isNewSpacePurchaseEnabled && spacePurchaseFlowAllowedForPlanChange) {
    const endpoint = createOrganizationEndpoint(orgId);
    const basePlan = await getBasePlan(endpoint);

    return isSelfServicePlan(basePlan) || isFreePlan(basePlan);
  }

  return false;
}
