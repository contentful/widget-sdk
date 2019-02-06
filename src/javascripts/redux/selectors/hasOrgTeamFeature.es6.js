import { get } from 'lodash';

// signature for selectors with arguments: (state, props) => value
// harder to cache compared to returning maps, but that should not be an issue here
export default (state, { orgId }) =>
  get(state, ['orgsConstants', 'catalogFeatures', orgId, 'teams', 'enabled'], false);
