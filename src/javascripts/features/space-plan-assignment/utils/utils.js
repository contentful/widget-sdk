import { get } from 'lodash';

export const resourcesToDisplay = [
  { id: 'environment', name: 'Environments' },
  { id: 'role', name: 'Roles' },
  { id: 'locale', name: 'Locales' },
  { id: 'content_type', name: 'Content types' },
  { id: 'record', name: 'Records' },
];

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
  const planLimits = Object.values(resourcesToDisplay).reduce((memo, { id, name }) => {
    const charge = plan.ratePlanCharges.find((charge) => charge.name === name);
    memo[id] = get(charge, 'tiers[0].endingUnit');
    return memo;
  }, {});
  const planIsTooSmall = resourcesToDisplay.some(
    ({ id }) => spaceResources[id].usage > planLimits[id]
  );
  return !planIsTooSmall;
}
