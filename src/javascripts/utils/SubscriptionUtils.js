import { calculateTotalPrice } from 'account/pricing/PricingDataProvider';

/**
 * Calculates the cost for the given numMemberships for a given basePlan.
 * @param  {Object} options.basePlan       The base plan object
 * @param  {Number} options.numMemberships Number of users
 * @return {Number}                        The cost for this many users for this base plan
 */
export function calculateUsersCost({ basePlan, numMemberships }) {
  const tiers = getUsersTiers(basePlan);

  return tiers.reduce((memo, tier) => {
    const { startingUnit, endingUnit, price, priceFormat } = tier;

    // The free tier currently has a startingUnit of 0, but the other tiers have a
    // non-zero based startingUnit (e.g. 11).
    const normalizedStartingUnit = startingUnit > 0 ? startingUnit - 1 : startingUnit;

    if (endingUnit && numMemberships > endingUnit) {
      if (priceFormat === 'FlatFee') {
        return memo + price;
      } else {
        return memo + price * (endingUnit - normalizedStartingUnit);
      }
    } else if (numMemberships >= startingUnit) {
      if (priceFormat === 'FlatFee') {
        return memo + price;
      } else {
        return memo + price * (numMemberships - normalizedStartingUnit);
      }
    } else {
      return memo;
    }
  }, 0);
}

/**
 * Calculates the number of free and paid users, plus the cost of all the users.
 * @param  {Object} options.basePlan
 * @param  {Number} options.numMemberships
 * @return {Object}                        The number of free & paid users plus the total
 */
export function calcUsersMeta({ basePlan, numMemberships }) {
  const tiers = getUsersTiers(basePlan);

  // Should only be one free tier
  const freeTier = tiers.find((tier) => tier.price === 0);
  // Enterprise trial has no users limit
  const freeTierUsers =
    freeTier.endingUnit === null ? numMemberships : freeTier.endingUnit - freeTier.startingUnit;
  const numFree = numMemberships > freeTierUsers ? freeTierUsers : numMemberships;
  const numPaid = numMemberships > freeTierUsers ? numMemberships - freeTierUsers : 0;
  const cost = calculateUsersCost({ basePlan, numMemberships });
  const hardLimit = tiers[tiers.length - 1].endingUnit;
  // Should only be one paying tier
  const perUnitTier = tiers.find((tier) => tier.priceFormat === 'PerUnit');
  const unitPrice = perUnitTier ? perUnitTier.price : undefined;

  return { numFree, numPaid, cost, hardLimit, unitPrice };
}

/**
 * Calculates the total price for all plans and users
 * @param {Object} basePlan base plan of the organization
 * @param {Array} spacePlans Array with all space plan objects
 * @param  {Array} addOnPlans Array with all add-on plan objects
 * @param  {Number} numMemberships Number of memberships
 * @return {Object} Contains total of subscription costs and a list of line items
 */
export function calculateSubscriptionCosts(basePlan, spacePlans, addOnPlans, numMemberships) {
  const spaceCosts = calculateTotalPrice(spacePlans);
  const addOnCosts = calculateTotalPrice(addOnPlans);
  const usersCost = calculateUsersCost({ basePlan, numMemberships });

  const total = spaceCosts + usersCost + addOnCosts;

  // Only return lineItem that the user is paying for (ie. above $0)
  const lineItems = [
    createLineItem('Spaces', spaceCosts),
    ...calculateAppsLineItems(addOnPlans),
    createLineItem('Additional users', usersCost),
  ].filter((lineItem) => {
    return lineItem.price > 0;
  });

  return {
    total,
    lineItems,
  };
}

function calculateAppsLineItems(addOnPlans) {
  return addOnPlans.map((plan) => {
    return createLineItem(plan.name, plan.price);
  });
}

function createLineItem(name, price) {
  return { name, price };
}

/**
 * Gets all enabled features for a given plan
 * @param  {Array}  options.ratePlanCharges Rate plan charges for this plan
 * @return {Array}                         Rate plan charges that are features
 */
export function getEnabledFeatures({ ratePlanCharges = [] }) {
  return ratePlanCharges.filter(({ unitType }) => unitType === 'feature');
}

function getUsersTiers(basePlan) {
  // shortform of Base rate plan charges
  const baseRPCs = basePlan.ratePlanCharges;
  const usersRPC = baseRPCs.find((rpc) => rpc.name === 'Users');
  const tiers = usersRPC.tiers;

  return tiers;
}
