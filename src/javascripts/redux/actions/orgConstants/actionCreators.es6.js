import * as actions from './actions.es6';
import getToken from 'redux/selectors/getToken.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getOrgConstants } from 'redux/selectors/getOrgConstants.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import { getOrganizationStatusV1, getOrganizationStatusV2 } from 'data/OrganizationStatus.es6';

const catalogFeatures = {
  TEAMS: 'teams',
  CUSTOM_SIDEBAR: 'custom_sidebar'
};

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
      const featureIds = Object.values(catalogFeatures);
      const values = await Promise.all(
        featureIds.map(featureId => getOrgFeature(orgId, featureId, false))
      );
      return featureIds.reduce((memo, featureId, index) => {
        memo[featureId] = values[index];
        return memo;
      }, {});
    };

    const getStatus = async () =>
      isLegacy ? getOrganizationStatusV1(org) : getOrganizationStatusV2(org);

    try {
      const [features, { isPaid, isEnterprise }] = await Promise.all([getFeatures(), getStatus()]);
      const payload = {
        catalogFeatures: features,
        isLegacy,
        isPaid,
        isEnterprise,
        pricingVersion: org.pricingVersion
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
