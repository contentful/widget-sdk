import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get, isUndefined } from 'lodash';

import { getPlansWithSpaces } from 'account/pricing/PricingDataProvider';
import { getAllProductRatePlans } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { getSpaces } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization } from 'services/TokenStore';
import { calcUsersMeta, calculateSubscriptionTotal } from 'utils/SubscriptionUtils';
import {
  isOrganizationOnTrial,
  canStartAppTrial,
  AppTrialRepo,
  isActiveAppTrial,
  isExpiredAppTrial,
} from 'features/trials';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { SubscriptionPage } from '../components/SubscriptionPage';

const getBasePlan = (plans) => plans.items.find(({ planType }) => planType === 'base');

const getAddOnPlan = (plans) => plans.items.find(({ planType }) => planType === 'add_on');

const getSpacePlans = (plans, accessibleSpaces) =>
  plans.items
    .filter(({ planType }) => ['space', 'free_space'].includes(planType))
    .sort((plan1, plan2) => {
      const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
      return name1.localeCompare(name2);
    })
    .map((plan) => {
      if (plan.space) {
        const accessibleSpace = accessibleSpaces.find(
          (space) => space.sys.id === plan.space.sys.id
        );
        plan.space.isAccessible = !!accessibleSpace;
      }
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

const fetch = (organizationId, { setSpacePlans }) => async () => {
  const organization = await getOrganization(organizationId);

  const endpoint = createOrganizationEndpoint(organizationId);

  if (!isOwnerOrAdmin(organization)) {
    if (isOrganizationOnTrial(organization)) {
      const spaces = await getAllSpaces(endpoint);
      return {
        organization,
        memberAccessibleSpaces: spaces,
      };
    }

    throw new Error();
  }

  const [plansWithSpaces, productRatePlans, numMemberships] = await Promise.all([
    getPlansWithSpaces(endpoint),
    getAllProductRatePlans(endpoint),
    fetchNumMemberships(organizationId),
  ]);

  if (!plansWithSpaces || !productRatePlans) {
    throw new Error();
  }

  // spaces that current user has access to
  const accessibleSpaces = await getSpaces();

  // separating all the different types of plans
  const basePlan = getBasePlan(plansWithSpaces);
  const addOnPlan = getAddOnPlan(plansWithSpaces);
  const spacePlans = getSpacePlans(plansWithSpaces, accessibleSpaces);

  const usersMeta = calcUsersMeta({ basePlan, numMemberships });

  const [appCatalogFeature, isTrialAvailable] = await Promise.all([
    AppTrialRepo.getTrial(organizationId),
    canStartAppTrial(organizationId),
  ]);

  setSpacePlans(spacePlans);

  return {
    basePlan,
    addOnPlan,
    usersMeta,
    numMemberships,
    organization,
    productRatePlans,
    isTrialAvailable,
    isTrialActive: isActiveAppTrial(appCatalogFeature),
    isTrialExpired: isExpiredAppTrial(appCatalogFeature),
  };
};

export function SubscriptionPageRouter({ orgId: organizationId }) {
  const [spacePlans, setSpacePlans] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const { isLoading, error, data = {} } = useAsync(
    useCallback(fetch(organizationId, { setSpacePlans }), [])
  );

  useEffect(() => {
    if (spacePlans.length > 0 && data.basePlan && data.numMemberships) {
      // spacePlans gets updated after the user deletes a space
      // we need to add the basePlan and the addons to it so we can correctly calculate the GrandTotal
      const allPlans = [data.basePlan, ...spacePlans];

      if (data.addOnPlan) {
        allPlans.push(data.addOnPlan);
      }

      const totalPrice = calculateSubscriptionTotal(allPlans, data.numMemberships);
      setGrandTotal(totalPrice);
    }
  }, [spacePlans, data.addOnPlan, data.basePlan, data.numMemberships]);

  if (error) {
    return <ForbiddenPage />;
  }

  return (
    <>
      <DocumentTitle title="Subscription" />
      <SubscriptionPage
        basePlan={data.basePlan}
        addOnPlan={data.addOnPlan}
        usersMeta={data.usersMeta}
        organization={data.organization}
        memberAccessibleSpaces={data.memberAccessibleSpaces}
        grandTotal={grandTotal}
        initialLoad={isLoading}
        spacePlans={spacePlans}
        onSpacePlansChange={(newSpacePlans) => setSpacePlans(newSpacePlans)}
        isTrialAvailable={data.isTrialAvailable}
        isTrialActive={data.isTrialActive}
        isTrialExpired={data.isTrialExpired}
      />
    </>
  );
}

SubscriptionPageRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
