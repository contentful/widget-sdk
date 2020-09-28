import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
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
import { getSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import { getModule } from 'core/NgRegistry';
import * as OrganizationRoles from 'services/OrganizationRoles';
import createResourceService from 'services/ResourceService';
import * as PricingService from 'services/PricingService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

const fetch = async ({
  organization,
  organizationId,
  spaceId,
  environmentId,
  isMasterEnvironment,
}) => {
  const isOrgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(organization);
  const orgIsLegacy = isLegacyOrganization(organization);
  /** TODO: Change it to a `localeRepo` instance
   * We can create the `localeRepo` instance instead but this would break the contract tests
   * because we would need to pass the environment ID and this would change the expected URL for Cypress
   * while other parts of the app are still using it from the Angular spaceContext
   **/
  const spaceContext = getModule('spaceContext');

  const promisesArray = [
    spaceContext.localeRepo.getAll(),
    createResourceService(spaceId).get('locale', environmentId),
    createLegacyFeatureService(spaceId).get('multipleLocales'),
    isMasterEnvironment,
    getSpaceFeature(spaceId, FEATURES.ENVIRONMENT_USAGE_ENFORCEMENT),
    _.get(organization, ['subscriptionPlan', 'name']),
  ];

  if (!orgIsLegacy && isOrgOwnerOrAdmin) {
    // This fetch only works when user is an owner or admin.
    promisesArray.push(
      PricingService.nextSpacePlanForResource(
        organizationId,
        spaceId,
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
  const {
    currentOrganization,
    currentOrganizationId,
    currentSpaceId,
    currentEnvironmentId,
    currentSpace,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const { isLoading, error, data = {} } = useAsync(
    useCallback(
      () =>
        fetch({
          organization: currentOrganization,
          organizationId: currentOrganizationId,
          spaceId: currentSpaceId,
          environmentId: currentEnvironmentId,
          isMasterEnvironment,
        }),
      [
        currentOrganization,
        currentOrganizationId,
        currentSpaceId,
        currentEnvironmentId,
        isMasterEnvironment,
      ]
    )
  );

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
