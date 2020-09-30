import React, { useCallback, useState, useEffect } from 'react';
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
import { getVariation, FLAGS } from 'LaunchDarkly';
import { isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { isOrganizationOnTrial } from 'features/trials';

import DocumentTitle from 'components/shared/DocumentTitle';

import SubscriptionPage from './SubscriptionPage';

import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';

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
        const accessibleSpace = accessibleSpaces.find(
          (space) => space.sys.id === plan.space.sys.id
        );
        plan.space.isAccessible = !!accessibleSpace;
        plan.space.expiresAt = accessibleSpace && accessibleSpace.trialPeriodEndsAt;
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

const fetch = (organizationId, { setSpacePlans, setGrandTotal }) => async () => {
  const organization = await getOrganization(organizationId);

  const endpoint = createOrganizationEndpoint(organizationId);

  const [isPlatformTrialCommEnabled, newSpacePurchaseEnabled] = await Promise.all([
    getVariation(FLAGS.PLATFORM_TRIAL_COMM, {
      organizationId: organization.sys.id,
    }),
    getVariation(FLAGS.NEW_PURCHASE_FLOW, {
      organizationId: organization.sys.id,
    }),
  ]);

  if (!isOwnerOrAdmin(organization)) {
    if (isPlatformTrialCommEnabled && isOrganizationOnTrial(organization)) {
      const spaces = await getAllSpaces(endpoint);
      return {
        organization,
        memberAccessibleSpaces: spaces,
        isPlatformTrialCommEnabled,
        newSpacePurchaseEnabled,
      };
    }

    throw new Error();
  }

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

  const isOrgCreatedBeforeV2Pricing = await getVariation(FLAGS.PAYING_PREV_V2_ORG, {
    organizationId,
  });

  // We only want to show this support card for self-service on-demand users who originally had access
  // to these types of spaces and have since been migrated to the community plan.
  const showMicroSmallSupportCard = isSelfServicePlan(basePlan) && isOrgCreatedBeforeV2Pricing;

  setSpacePlans(spacePlans);
  setGrandTotal(
    calculateTotalPrice({
      allPlans: plans.items,
      numMemberships,
    })
  );

  return {
    basePlan,
    usersMeta,
    numMemberships,
    organization,
    productRatePlans,
    showMicroSmallSupportCard,
    isPlatformTrialCommEnabled,
    newSpacePurchaseEnabled,
  };
};

export default function SubscriptionPageRouter({ orgId: organizationId }) {
  const [spacePlans, setSpacePlans] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const { isLoading, error, data = {} } = useAsync(
    useCallback(fetch(organizationId, { setSpacePlans, setGrandTotal }), [])
  );

  useEffect(() => {
    if (spacePlans.length === 0 || !data.basePlan || !data.numMemberships) {
      return;
    }
    // The spacePlans doesn't include the base plan, so we add it back in so that the total price can be calculatd.
    const allPlans = spacePlans.concat([data.basePlan]);

    setGrandTotal(
      calculateTotalPrice({
        allPlans,
        numMemberships: data.numMemberships,
      })
    );
  }, [spacePlans, data.basePlan, data.numMemberships]);

  if (error) {
    return <ForbiddenPage />;
  }

  const props = {
    ...data,
    initialLoad: isLoading,
    organizationId,
    spacePlans,
    grandTotal,
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
