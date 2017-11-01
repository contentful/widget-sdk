import {get} from 'lodash';

// we put double \\, so in regexes they are parsed
// correctly, with one \
const terms = '\\((quarterly|monthly|annual)\\)';
// these names are hardcoded, and there are no strict
// rules about it, so there is always a possibility
// marketing team will introduce some new names, which
// are not here
const ENTERPRISE_NAMES = [
  new RegExp('enterprise', 'i'),
  new RegExp(`scale\\s${terms}`, 'i'),
  new RegExp(`business\\s${terms}`, 'i')
];

/**
 * @description function to check whether organization has an enterprise
 * subscription plan or not. Used in LaunchDarkly to target enterprise
 * users specifically, so we don't change applicaiton for them
 * @param {Organization} org - organization to check subscription type
 * @returns {boolean} - enterprise subscription or not
 */
export function isOrgPlanEnterprise (org) {
  const subscriptionPlanName = get(org, 'subscriptionPlan.name', '');
  return ENTERPRISE_NAMES.some(regexp => regexp.test(subscriptionPlanName));
}
