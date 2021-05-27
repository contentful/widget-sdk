import { useContext } from 'react';
import { OrgSubscriptionContext } from '../context';
import { calculateSubscriptionCosts } from 'utils/SubscriptionUtils';
import type { SubscriptionCosts } from '../types';

/**
 * This hook is used to calculate the subscription costs
 */
export function useCalculateSubscriptionCosts(): SubscriptionCosts | null {
  const {
    state: { basePlan, addOnPlans, spacePlans, numMemberships },
  } = useContext(OrgSubscriptionContext);

  let subscriptionCosts = null;
  if (basePlan && addOnPlans && spacePlans && numMemberships) {
    subscriptionCosts = calculateSubscriptionCosts(
      basePlan,
      spacePlans,
      addOnPlans,
      numMemberships
    );
  }

  return subscriptionCosts;
}
