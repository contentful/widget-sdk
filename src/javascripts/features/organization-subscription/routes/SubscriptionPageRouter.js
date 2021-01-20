import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get, isUndefined } from 'lodash';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { getPlansWithSpaces, getProductPlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { getSpaces } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization } from 'services/TokenStore';
import { calcUsersMeta, calculateTotalPrice } from 'utils/SubscriptionUtils';
import { isOrganizationOnTrial } from 'features/trials';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { SubscriptionPage } from '../components/SubscriptionPage';

const getBasePlan = (plans) => plans.items.find(({ planType }) => planType === 'base');

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

const fetch = (organizationId, { setSpacePlans, setGrandTotal }) => async () => {
  const organization = await getOrganization(organizationId);

  const endpoint = createOrganizationEndpoint(organizationId);

  const newSpacePurchaseEnabled = await getVariation(FLAGS.NEW_PURCHASE_FLOW, {
    organizationId: organization.sys.id,
  });

  if (!isOwnerOrAdmin(organization)) {
    if (isOrganizationOnTrial(organization)) {
      const spaces = await getAllSpaces(endpoint);
      return {
        organization,
        memberAccessibleSpaces: spaces,
        newSpacePurchaseEnabled,
      };
    }

    throw new Error();
  }

  const [plansWithSpaces, productRatePlans, numMemberships] = await Promise.all([
    getPlansWithSpaces(endpoint),
    getProductPlans(endpoint),
    fetchNumMemberships(organizationId),
  ]);

  if (!plansWithSpaces || !productRatePlans) {
    throw new Error();
  }

  // spaces that current user has access to
  const accessibleSpaces = await getSpaces();

  const basePlan = getBasePlan(plansWithSpaces);
  const spacePlans = getSpacePlans(plansWithSpaces, accessibleSpaces);
  const usersMeta = calcUsersMeta({ basePlan, numMemberships });

  setSpacePlans(spacePlans);
  setGrandTotal(
    calculateTotalPrice({
      allPlans: plansWithSpaces.items,
      numMemberships,
    })
  );

  return {
    basePlan,
    usersMeta,
    numMemberships,
    organization,
    productRatePlans,
    newSpacePurchaseEnabled,
  };
};

export function SubscriptionPageRouter({ orgId: organizationId }) {
  const [spacePlans, setSpacePlans] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const { isLoading, error, data = {} } = useAsync(
    useCallback(fetch(organizationId, { setSpacePlans, setGrandTotal }), [])
  );

  useEffect(() => {
    if (spacePlans.length === 0 || !data.basePlan || !data.numMemberships) {
      return;
    }

    setGrandTotal(
      calculateTotalPrice({
        allPlans: spacePlans.concat([data.basePlan]),
        numMemberships: data.numMemberships,
      })
    );
  }, [spacePlans, data.basePlan, data.numMemberships]);

  if (error) {
    return <ForbiddenPage />;
  }

  return (
    <>
      <DocumentTitle title="Subscription" />
      <SubscriptionPage
        basePlan={data.basePlan}
        usersMeta={data.usersMeta}
        organization={data.organization}
        memberAccessibleSpaces={data.memberAccessibleSpaces}
        grandTotal={grandTotal}
        organizationId={organizationId}
        initialLoad={isLoading}
        spacePlans={spacePlans}
        onSpacePlansChange={(newSpacePlans) => setSpacePlans(newSpacePlans)}
        newSpacePurchaseEnabled
      />
    </>
  );
}

SubscriptionPageRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};