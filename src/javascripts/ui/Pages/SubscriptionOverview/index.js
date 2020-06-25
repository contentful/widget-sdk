import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { get, isUndefined } from 'lodash';

import { getPlansWithSpaces, getRatePlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { getSpaces } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { calcUsersMeta, calculateTotalPrice } from 'utils/SubscriptionUtils';
import { getOrganization } from 'services/TokenStore';
import { getVariation } from 'LaunchDarkly';
import { PRICING_2020_RELEASED, PAYING_PREV_V2_ORG } from 'featureFlags';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';

import DocumentTitle from 'components/shared/DocumentTitle';

import SubscriptionPage from './SubscriptionPage';

import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';

const getBasePlan = (plans) => plans.items.find(({ planType }) => planType === 'base');
const getSpacePlans = (plans, accessibleSpaces) =>
  plans.items
    .filter(({ planType }) => ['space', 'free_space'].includes(planType))
    .sort((plan1, plan2) => {
      const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
      return name1.localeCompare(name2);
    })
    // Set space.isAccessible to check if current user can go to space details.
    .map((plan) => {
      if (plan.space) {
        plan.space.isAccessible = !!accessibleSpaces.find(
          (space) => space.sys.id === plan.space.sys.id
        );
      }
      // plan price is undefined for a free space
      // later on in the code, we use mathematical ops (like comparison)
      // using this value which fails. Therefore, setting this to 0
      // makes all the later usages sane.
      if (isUndefined(plan.price)) {
        plan.price = 0;
      }
      return plan;
    });

async function fetchNumMemberships(organizationId) {
  const resources = createResourceService(organizationId, 'organization');
  const membershipsResource = await resources.get('organization_membership');
  return membershipsResource.usage;
}

const fetch = (organizationId, setSpacePlans) => async () => {
  const organization = await getOrganization(organizationId);

  if (!isOwnerOrAdmin(organization)) {
    throw new Error();
  }

  const endpoint = createOrganizationEndpoint(organizationId);

  const [plans, productRatePlans, numMemberships] = await Promise.all([
    getPlansWithSpaces(endpoint),
    getRatePlans(endpoint),
    fetchNumMemberships(organizationId),
  ]);

  if (!plans || !productRatePlans) {
    throw new Error();
  }

  // spaces that current user has access to
  const accessibleSpaces = await getSpaces();

  const basePlan = getBasePlan(plans);
  const spacePlans = getSpacePlans(plans, accessibleSpaces);
  const usersMeta = calcUsersMeta({ basePlan, numMemberships });
  const grandTotal = calculateTotalPrice({
    allPlans: plans.items,
    basePlan,
    numMemberships,
  });

  const isCommunityPlanEnabled = await getVariation(PRICING_2020_RELEASED, {
    organizationId,
  });

  const isOrgCreatedBeforeV2Pricing = await getVariation(PAYING_PREV_V2_ORG, {
    organizationId,
  });

  // We only want to show this support card for non-enterprise on-demand users who originally had access
  // to these types of spaces and have since been migrated to the community plan.
  const showMicroSmallSupportCard =
    !isEnterprisePlan(basePlan) && isCommunityPlanEnabled && isOrgCreatedBeforeV2Pricing;

  setSpacePlans(spacePlans);

  return {
    basePlan,
    grandTotal,
    usersMeta,
    organization,
    productRatePlans,
    showMicroSmallSupportCard,
  };
};

export default function SubscriptionPageRouter({ orgId: organizationId }) {
  const [spacePlans, setSpacePlans] = useState([]);
  const { isLoading, error, data = {} } = useAsync(
    useCallback(fetch(organizationId, setSpacePlans), [])
  );

  if (error) {
    return <ForbiddenPage />;
  }

  const props = {
    ...data,
    initialLoad: isLoading,
    organizationId,
    spacePlans,
    onSpacePlansChange: (newSpacePlans) => {
      setSpacePlans(newSpacePlans);
    },
  };

  return (
    <>
      <DocumentTitle title="Subscription" />
      <SubscriptionPage {...props} />
    </>
  );
}

SubscriptionPageRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
