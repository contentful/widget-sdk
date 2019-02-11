import * as actions from './actions.es6';
import getToken from 'redux/selectors/getToken.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getOrgConstants } from 'redux/selectors/getOrgConstants.es6';
import { flow, keyBy, defaultTo, get } from 'lodash/fp';

import { getOrgFeatures } from 'data/CMA/FeatureCatalog.es6';
import { getOrganizationStatusV1, getOrganizationStatusV2 } from 'data/OrganizationStatus.es6';

const catalogFeatures = {
  TEAMS: 'teams'
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
    const getFeatures = () => getOrgFeatures(orgId, Object.values(catalogFeatures));
    const getStatus = async () =>
      isLegacy ? getOrganizationStatusV1(org) : getOrganizationStatusV2(org);

    try {
      const [features, { isPaid, isEnterprise }] = await Promise.all([getFeatures(), getStatus()]);
      const payload = {
        catalogFeatures: flow(
          get('items'),
          keyBy('sys.feature_id'),
          defaultTo({})
        )(features),
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
