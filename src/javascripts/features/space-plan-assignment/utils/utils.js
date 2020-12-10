import { get } from 'lodash';
import pluralize from 'pluralize';
export const ASSIGNMENT_FLOW_TYPE = 'assignment';
export const resourcesToDisplay = [
  { id: 'environment', name: 'Environments' },
  { id: 'role', name: 'Roles' },
  { id: 'locale', name: 'Locales' },
  { id: 'content_type', name: 'Content types' },
  { id: 'record', name: 'Records' },
];

export function buildPlanKey(planName, ratePlanCharges) {
  const charges = Object.values(resourcesToDisplay).reduce((memo, { id, name }) => {
    const charge = ratePlanCharges.find((charge) => charge.name === name);
    memo[id] = get(charge, 'tiers[0].endingUnit');
    return memo;
  }, {});

  return `${planName}_${charges['environment']}_${charges['role']}_${charges['locale']}_${charges['content_type']}_${charges['record']}`;
}

export function orderPlanKeys(groupedPlans, defaultRatePlanKeys) {
  // plans are already sorted by price but we want to push the custom plans in each group after the default one
  return Object.keys(groupedPlans).sort(function (x, y) {
    if (x.split('_')[0] !== y.split('_')[0]) {
      return 0;
    }
    if (!defaultRatePlanKeys.includes(x) && defaultRatePlanKeys.includes(y)) {
      return 1;
    }
    if (defaultRatePlanKeys.includes(x) && !defaultRatePlanKeys.includes(y)) {
      return -1;
    }
    return 0;
  });
}

export function groupPlans(plans) {
  const groupedPlans = {};
  plans.forEach((plan) => {
    // handle free plan case which does not have a subscription
    const planCharges = plan.ratePlanCharges ?? plan.productRatePlanCharges;
    const key = buildPlanKey(plan.name, planCharges);
    if (key in groupedPlans) {
      groupedPlans[key].push(plan);
    } else {
      groupedPlans[key] = [plan];
    }
  });
  return groupedPlans;
}

// we don't validate role limits when changing plans.
// in the future we can check in the BE if the extra roles are being used but
// it's also currently hard to know if there are any custom roles in the old plan
export const resourcesToValidate = resourcesToDisplay.filter((r) => r.id !== 'role');

export function getIncludedResources(charges) {
  return Object.values(resourcesToDisplay).reduce((memo, { id, name }) => {
    const charge = charges.find((charge) => charge.name === name);
    let number = get(charge, 'tiers[0].endingUnit');

    // Add "extra" environment and role to include `master` and `admin`
    if (['Environments', 'Roles'].includes(name)) {
      number = number + 1;
    }

    memo[id] = number;
    return memo;
  }, {});
}

export function canPlanBeAssigned(plan, spaceResources) {
  const planLimits = Object.values(resourcesToValidate).reduce((memo, { id, name }) => {
    // handle free plan case which does not have a subscription
    const planCharges = plan.ratePlanCharges ?? plan.productRatePlanCharges;
    const charge = planCharges.find((charge) => charge.name === name);
    memo[id] = get(charge, 'tiers[0].endingUnit');
    return memo;
  }, {});

  const planIsTooSmall = resourcesToValidate.some(
    ({ id }) => spaceResources[id].usage > planLimits[id]
  );
  return !planIsTooSmall;
}

export function getTooltip(id, limit) {
  if (id === 'environment') {
    return `This space type includes 1 master and ${pluralize(
      'sandbox environment',
      limit - 1,
      true
    )}.`;
  } else if (id === 'record') {
    return 'Records are entries and assets combined.';
  }
  return;
}
