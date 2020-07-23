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
import createResourceService from 'services/ResourceService';
import * as PricingService from 'services/PricingService';

const fetch = async () => {
  const spaceContext = getModule('spaceContext');
  const isOrgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(spaceContext.organization);

  const orgIsLegacy = isLegacyOrganization(spaceContext.organization);

  const promisesArray = [
    spaceContext.localeRepo.getAll(),
    createResourceService(spaceContext.getId()).get('locale', spaceContext.getEnvironmentId()),
    createLegacyFeatureService(spaceContext.getId()).get('multipleLocales'),
    spaceContext.isMasterEnvironment(),
    getSpaceFeature(spaceContext.getId(), ENVIRONMENT_USAGE_ENFORCEMENT),
    _.get(spaceContext.organization, ['subscriptionPlan', 'name']),
  ];

  if (!orgIsLegacy && isOrgOwnerOrAdmin) {
    // This fetch only works when user is an owner or admin.
    promisesArray.push(
      PricingService.nextSpacePlanForResource(
        spaceContext.organization.sys.id,
        spaceContext.getId(),
        PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE
      )
    );
  }

  const [
    // Required Promises
    locales,
    localeResource,
    isMultipleLocalesFeatureEnabled,
    insideMasterEnv,
    allowedToEnforceLimits,
    subscriptionPlanName,
    // Conditional Promises:
    nextSpacePlan,
  ] = await Promise.all(promisesArray);

  const hasNextSpacePlan = !!nextSpacePlan;

  return {
    locales,
    isLegacy: orgIsLegacy,
    localeResource,
    isMultipleLocalesFeatureEnabled,
    insideMasterEnv,
    allowedToEnforceLimits,
    subscriptionPlanName,
    isOrgOwnerOrAdmin,
    hasNextSpacePlan,
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
    hasNextSpacePlan,
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
          hasNextSpacePlan={hasNextSpacePlan}
        />
      )}
    </>
  );
};

LocalesListRoute.propTypes = {
  showUpgradeSpaceDialog: PropTypes.func.isRequired,
  getComputeLocalesUsageForOrganization: PropTypes.func.isRequired,
};
