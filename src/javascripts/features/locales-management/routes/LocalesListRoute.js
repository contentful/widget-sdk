import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getModule } from 'core/NgRegistry';
import { LocalesListSkeleton } from '../skeletons/LocalesListSkeleton';
import { LocalesListPricingOne } from '../LocalesListPricingOne';
import { LocalesListPricingTwo } from '../LocalesListPricingTwo';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import StateRedirect from 'app/common/StateRedirect';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSubscriptionState } from './utils/getSubscriptionState';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags';
import { useAsync } from 'core/hooks';

import * as OrganizationRoles from 'services/OrganizationRoles';
import * as ResourceService from 'services/ResourceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';

const fetch = async () => {
  const spaceContext = getModule('spaceContext');
  const isOrgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(spaceContext.organization);

  const createResourceService = ResourceService.default;
  const endpoint = createOrganizationEndpoint(spaceContext.organization.sys.id);

  const promisesArray = [
    spaceContext.localeRepo.getAll(),
    isLegacyOrganization(spaceContext.organization),
    createResourceService(spaceContext.getId()).get('locale', spaceContext.getEnvironmentId()),
    createLegacyFeatureService(spaceContext.getId()).get('multipleLocales'),
    spaceContext.isMasterEnvironment(),
    getSpaceFeature(spaceContext.getId(), ENVIRONMENT_USAGE_ENFORCEMENT),
    _.get(spaceContext.organization, ['subscriptionPlan', 'name']),
  ];

  if (isOrgOwnerOrAdmin) {
    // This fetch only works when user is an owner or admin.
    promisesArray.push(getSingleSpacePlan(endpoint, spaceContext.getId()));
  }

  const [
    // Required Promises
    locales,
    isLegacy,
    localeResource,
    isMultipleLocalesFeatureEnabled,
    insideMasterEnv,
    allowedToEnforceLimits,
    subscriptionPlanName,
    // Conditional Promises:
    spacePlan,
  ] = await Promise.all(promisesArray);

  const isLargePlan = spacePlan?.name === 'Large';

  return {
    locales,
    isLegacy,
    localeResource,
    isMultipleLocalesFeatureEnabled,
    insideMasterEnv,
    allowedToEnforceLimits,
    subscriptionPlanName,
    isOrgOwnerOrAdmin,
    isLargePlan,
  };
};

export const LocalesListRoute = ({
  showUpgradeSpaceDialog,
  getComputeLocalesUsageForOrganization,
}) => {
  const { isLoading, error, data = {} } = useAsync(useCallback(fetch, []));

  if (!getSectionVisibility()['locales']) {
    return <ForbiddenPage />;
  }

  if (error) {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }

  const {
    locales,
    isLegacy,
    localeResource,
    isMultipleLocalesFeatureEnabled,
    isOrgOwnerOrAdmin,
    insideMasterEnv,
    allowedToEnforceLimits,
    subscriptionPlanName,
    isLargePlan,
  } = data;

  return (
    <>
      <DocumentTitle title="Locales" />

      {isLoading ? (
        <LocalesListSkeleton />
      ) : isLegacy ? (
        <LocalesListPricingOne
          locales={locales}
          canCreateMultipleLocales={isMultipleLocalesFeatureEnabled}
          isOrgOwnerOrAdmin={isOrgOwnerOrAdmin}
          localeResource={localeResource}
          subscriptionState={getSubscriptionState()}
          insideMasterEnv={insideMasterEnv}
          subscriptionPlanName={subscriptionPlanName}
          getComputeLocalesUsageForOrganization={getComputeLocalesUsageForOrganization}
        />
      ) : (
        <LocalesListPricingTwo
          locales={locales}
          allowedToEnforceLimits={allowedToEnforceLimits}
          isOrgOwnerOrAdmin={isOrgOwnerOrAdmin}
          localeResource={localeResource}
          subscriptionState={getSubscriptionState()}
          insideMasterEnv={insideMasterEnv}
          upgradeSpace={() =>
            showUpgradeSpaceDialog({
              onSubmit: () => fetch(),
            })
          }
          isLargePlan={isLargePlan}
        />
      )}
    </>
  );
};

LocalesListRoute.propTypes = {
  showUpgradeSpaceDialog: PropTypes.func.isRequired,
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired,
};
