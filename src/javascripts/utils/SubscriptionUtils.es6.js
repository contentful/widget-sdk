/**
 * Calculates the cost for the given numMemberships for a given basePlan.
 * @param  {Object} options.basePlan       The base plan object
 * @param  {Number} options.numMemberships Number of users
 * @return {Number}                        The cost for this many users for this base plan
 */
export function calculateUsersCost ({ basePlan, numMemberships }) {
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
export function calcUsersMeta ({ basePlan, numMemberships }) {
  const tiers = getUsersTiers(basePlan);

  // Should only be one free tier
  const freeTier = tiers.find(tier => tier.price === 0);
  const freeTierUsers = freeTier.endingUnit - freeTier.startingUnit;
  const numFree = numMemberships > freeTierUsers ? freeTierUsers : numMemberships;
  const numPaid = numMemberships > freeTierUsers ? (numMemberships - freeTierUsers) : 0;
  const cost = calculateUsersCost({ basePlan, numMemberships });

  return { numFree, numPaid, cost };
}

/**
 * Calculates the total price for all plans and users
 * @param  {Array} options.allPlans       All plan objects
 * @param  {Number} options.numMemberships Number of memberships
 * @return {Number}                        Total cost
 */
export function calculateTotalPrice ({ allPlans, numMemberships }) {
  const basePlan = getBasePlan(allPlans);

  const plansCost = calculatePlansCost({ plans: allPlans });
  const usersCost = calculateUsersCost({ basePlan, numMemberships });

  return plansCost + usersCost;
}

/**
 * Gets all enabled features for a given plan
 * @param  {Array}  options.ratePlanCharges Rate plan charges for this plan
 * @return {Array}                         Rate plan charges that are features
 */
export function getEnabledFeatures ({ratePlanCharges = []}) {
  return ratePlanCharges.filter(({unitType}) => unitType === 'feature');
}

/**
 * Calculates the cost of the given plans
 * @param  {Array} options.plans
 * @return {Number}               Total cost
 */
export function calculatePlansCost ({ plans }) {
  return plans.reduce((total, plan) => {
    return total + (parseInt(plan.price, 10) || 0);
  }, 0);
}

function getBasePlan (allPlans) {
  return allPlans.find(plan => plan.planType === 'base');
}

function getUsersTiers (basePlan) {
  // shortform of Base rate plan charges
  const baseRPCs = basePlan.ratePlanCharges;
  const usersRPC = baseRPCs.find(rpc => rpc.name === 'Users');
  const tiers = usersRPC.tiers;

  return tiers;
}
