import React, { useCallback, useEffect, useState } from 'react';
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
import * as OrganizationRoles from 'services/OrganizationRoles';
import createResourceService from 'services/ResourceService';
import * as PricingService from 'services/PricingService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createLocaleRepo from 'data/CMA/LocaleRepo';
import { generateMessage } from 'utils/ResourceUtils';
import * as ChangeSpaceService from 'services/ChangeSpaceService';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { getSpaceEntitlementSet } from 'features/space-usage';

const fetch = async ({
  organization,
  organizationId,
  spaceId,
  environmentId,
  isMasterEnvironment,
}) => {
  const isOrgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(organization);
  const orgIsLegacy = isLegacyOrganization(organization);
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const localeRepo = createLocaleRepo(spaceEndpoint);

  const promisesArray = [
    localeRepo.getAll(),
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

export const LocalesListRoute = () => {
  const {
    currentOrganization,
    currentOrganizationId,
    currentSpaceId,
    currentEnvironmentId,
    currentSpace,
    currentSpaceData,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const [entitlementsAPIEnabled, setEntitlementsAPIEnabled] = useState();
  const [entitlementsSet, setEntitlementsSet] = useState();

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

  useEffect(() => {
    if (!currentSpaceId) return;

    getVariation(FLAGS.ENTITLEMENTS_API).then((isEnabled) => {
      setEntitlementsAPIEnabled(isEnabled);
      if (isEnabled) {
        getSpaceEntitlementSet(currentSpaceId)
          .then(setEntitlementsSet)
          .catch(() => {});
      }
    });
  }, [currentSpaceId]);

  function handleShowUpgradeSpaceDialog() {
    ChangeSpaceService.beginSpaceChange({
      organizationId: currentOrganizationId,
      space: currentSpaceData,
      onSubmit: () => fetch(),
    });
  }

  function getComputeLocalesUsageForOrganization() {
    /*
    The expectation of this function is a bit strange as it returns either a string or null, as it is the
    result of some legacy code. This should be refactored to be more clear in its intention.
   */
    if (generateMessage(localeResource).error) {
      return generateMessage(localeResource).error;
    } else {
      return null;
    }
  }

  if (!getSectionVisibility()['locales']) {
    return <ForbiddenPage />;
  }

  if (error) {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }

  // get entitlementsSet from new API behind feature flag
  const newApiLocalesLimit = entitlementsAPIEnabled
    ? entitlementsSet?.quotas?.locales.value
    : undefined;

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
          upgradeSpace={handleShowUpgradeSpaceDialog}
          hasNextSpacePlan={hasNextSpacePlan}
          newApiLocalesLimit={newApiLocalesLimit}
        />
      )}
    </>
  );
};
