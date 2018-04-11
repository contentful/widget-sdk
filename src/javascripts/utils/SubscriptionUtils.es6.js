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

export function calcUsersMeta ({ basePlan, numMemberships }) {
  const tiers = getUsersTiers(basePlan);

  // Should only be one free tier
  const freeTier = tiers.find(tier => tier.price === 0);
  const freeTierUsers = freeTier.endingUnit - freeTier.startingUnit;
  const numFreeUsers = numMemberships > freeTierUsers ? freeTierUsers : numMemberships;
  const numPaidUsers = numMemberships > freeTierUsers ? (numMemberships - freeTierUsers) : 0;
  const cost = calculateUsersCost({ basePlan, numMemberships });

  return { numFreeUsers, numPaidUsers, cost };
}

export function calculateTotalPrice ({ allPlans, basePlan, numMemberships }) {
  const plansCost = calculatePlansCost({ plans: allPlans });
  const usersCost = calculateUsersCost({ basePlan, numMemberships });

  return plansCost + usersCost;
}

export function getEnabledFeatures ({ratePlanCharges = []}) {
  return ratePlanCharges.filter(({unitType}) => unitType === 'feature');
}

export function calculatePlansCost ({ plans }) {
  return plans.reduce(
    (total, plan) => total + (parseInt(plan.price, 10) || 0),
    0
  );
}

function getUsersTiers (basePlan) {
  // shortform of Base rate plan charges
  const baseRPCs = basePlan.ratePlanCharges;
  const usersRPC = baseRPCs.find(rpc => rpc.name === 'Users');
  const tiers = usersRPC.tiers;

  return tiers;
}
