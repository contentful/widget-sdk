import {get} from 'lodash';

export function isOrgPlanEnterprise (org) {
  return /enterprise/i.test(get(org, 'subscriptionPlan.name', ''));
}
