import * as actions from './actions.es6';
import getToken from 'redux/selectors/getToken.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getOrgConstants } from 'redux/selectors/getOrgConstants.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import { getOrganizationStatusV1, getOrganizationStatusV2 } from 'data/OrganizationStatus.es6';

export const catalogFeatures = [
  { key: 'teams', defaultValue: false },
  { key: 'custom_sidebar', defaultValue: true }
];

export function fetchOrgConstants(orgId) {
  return async (dispatch, getState) => {
    const orgConstants = getOrgConstants(getState(), { orgId });
    // only run once per org
    if (orgConstants) return;

    dispatch(actions.orgConstantsPending(orgId));

    const token = getToken(getState());
    const org = token.organization.find(org => org.sys.id === orgId);
    const isLegacy = org.pricingVersion === 'pricing_version_1';

    // TODO: use multi key request for features
    const getFeatures = async () => {
      const values = await Promise.all(
        catalogFeatures.map(({ key, defaultValue }) => getOrgFeature(orgId, key, defaultValue))
      );
      return catalogFeatures.reduce((memo, feature, index) => {
        memo[feature.key] = values[index];
        return memo;
      }, {});
    };

    const getStatus = async () =>
      isLegacy ? getOrganizationStatusV1(org) : getOrganizationStatusV2(org);

    try {
      const [features, { isPaid, isEnterprise, pricingVersion }] = await Promise.all([
        getFeatures(),
        getStatus()
      ]);
      const payload = {
        catalogFeatures: features,
        isLegacy,
        isPaid,
        isEnterprise,
        pricingVersion
      };

      dispatch(actions.orgConstantsSuccess(orgId, payload));
    } catch (e) {
      dispatch(actions.orgConstantsFailure(orgId, e));
    }
  };
}

export function fetchCurrentOrgConstants() {
  return async (dispatch, getState) => {
    const orgId = getOrgId(getState());

    if (orgId) {
      dispatch(fetchOrgConstants(orgId));
    }
  };
}
