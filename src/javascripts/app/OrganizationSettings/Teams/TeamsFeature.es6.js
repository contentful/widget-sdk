import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import isLegacyEnterprise from 'data/isLegacyEnterprise.es6';

// This feature is enabled:
// - for all legacy enterprise organizations
// - with Product Product for selected organizations
export function isEnabled(org) {
  if (isLegacyEnterprise(org)) {
    return Promise.resolve(true);
  } else {
    return getOrgFeature(org.sys.id, 'teams', true);
  }
}
