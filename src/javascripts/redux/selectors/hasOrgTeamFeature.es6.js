import { get } from 'lodash';
import getOrgId from './getOrgId.es6';

/**
 * @description
 * Return if the current or given org has the Teams feature from the Product Catalog active
 *
 * Technical sidenote:
 * Signature for selectors with arguments is (state, props) => value
 * This is harder to cache compared to returning maps, but that should not be an issue here.
 * Without complex calculations there is not reason to cache the result.
 *
 * @param {string} props.orgId specific org to check instead of the current one
 * @return {boolean}
 */
export default (state, { orgId: orgIdOverwrite }) => {
  const orgId = orgIdOverwrite || getOrgId(state);
  return get(state, ['orgConstants', orgId, 'catalogFeatures', 'teams'], false);
};
