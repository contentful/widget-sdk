import { get } from 'lodash';

// signature for selectors with arguments: (state, props) => value
// harder to cache compared to returning maps, but that should not be an issue here
export default (state, { orgId: orgIdOverwrite }) => {
  const orgId = orgIdOverwrite || getOrgId(state);
  return get(state, ['orgConstants', orgId, 'catalogFeatures', 'teams', 'enabled'], false);
};
