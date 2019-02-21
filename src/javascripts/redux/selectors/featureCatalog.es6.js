import { get } from 'lodash';

// signature for selectors with arguments: (state, props) => value
export const hasOrgFeatureEnabled = (state, { orgId, feature }) =>
  get(state, ['orgsConstants', 'catalogFeatures', orgId, feature, 'enabled'], false);

// harder to cache compared to returning maps, but caching is not efficient here because of low number of orgs...
// ...and no computations
