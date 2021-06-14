import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { LocalesListSkeleton } from '../skeletons/LocalesListSkeleton';
import { LocalesListPricingTwo } from '../LocalesListPricingTwo';
import StateRedirect from 'app/common/StateRedirect';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import * as OrganizationRoles from 'services/OrganizationRoles';
import * as PricingService from 'services/PricingService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { createLocaleRepo } from 'data/CMA/LocaleRepo';
import * as ChangeSpaceService from 'services/ChangeSpaceService';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { getSpaceEntitlementSet } from 'features/space-usage';
import { getCMAClient } from 'core/services/usePlainCMAClient';

const fetch = async ({
  organization,
  organizationId,
  spaceId,
  environmentId,
  isMasterEnvironment,
  resources,
}) => {
  const isOrgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(organization);
  const cma = getCMAClient({ spaceId, environmentId, organizationId });
  const localeRepo = createLocaleRepo(cma);

  const promisesArray = [
    localeRepo.getAll(),
    resources.get('locale'),
    createLegacyFeatureService(spaceId).get('multipleLocales'),
    isMasterEnvironment,
    getSpaceFeature(spaceId, SpaceFeatures.ENVIRONMENT_USAGE_ENFORCEMENT),
    _.get(organization, ['subscriptionPlan', 'name']),
  ];

  if (isOrgOwnerOrAdmin) {
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
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceData,
    resources,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const [entitlementsAPIEnabled, setEntitlementsAPIEnabled] = useState();
  const [entitlementsSet, setEntitlementsSet] = useState();

  const {
    isLoading,
    error,
    data = {},
  } = useAsync(
    useCallback(
      () =>
        fetch({
          organization: currentOrganization,
          organizationId: currentOrganizationId,
          spaceId: currentSpaceId,
          environmentId: currentEnvironmentAliasId || currentEnvironmentId,
          isMasterEnvironment,
          resources,
        }),
      [
        currentOrganization,
        currentOrganizationId,
        currentSpaceId,
        currentEnvironmentId,
        currentEnvironmentAliasId,
        isMasterEnvironment,
        resources,
      ]
    )
  );
  const {
    locales,
    localeResource,
    isOrgOwnerOrAdmin,
    insideMasterEnv,
    allowedToEnforceLimits,
    hasNextSpacePlan,
  } = data;

  useEffect(() => {
    if (!currentSpaceId) {
      return;
    }

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
      ) : (
        <LocalesListPricingTwo
          locales={locales}
          allowedToEnforceLimits={allowedToEnforceLimits}
          isOrgOwnerOrAdmin={isOrgOwnerOrAdmin}
          localeResource={localeResource}
          insideMasterEnv={insideMasterEnv}
          upgradeSpace={handleShowUpgradeSpaceDialog}
          hasNextSpacePlan={hasNextSpacePlan}
          newApiLocalesLimit={newApiLocalesLimit}
        />
      )}
    </>
  );
};
