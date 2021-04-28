import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { getVariation, FLAGS } from 'LaunchDarkly';
import {
  getPlansWithSpaces,
  isEnterprisePlan,
  FREE,
  SELF_SERVICE,
  ENTERPRISE,
  ENTERPRISE_HIGH_DEMAND,
} from 'account/pricing/PricingDataProvider';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getAllProductRatePlans } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import isLegacyEnterprise from 'data/isLegacyEnterprise';
import { LoadingState } from 'features/loading-state';
import createResourceService from 'services/ResourceService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization, getSpaces } from 'services/TokenStore';
import { calcUsersMeta, calculateSubscriptionTotal } from 'utils/SubscriptionUtils';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { isOrganizationOnTrial } from 'features/trials';
import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import ContactUsButton from 'ui/Components/ContactUsButton';

import { findAllPlans } from '../utils';
import { SubscriptionPage } from '../components/SubscriptionPage';
import { NonEnterpriseSubscriptionPage } from '../components/NonEnterpriseSubscriptionPage';
import { EnterpriseSubscriptionPage } from '../components/EnterpriseSubscriptionPage';

// List of tiers that already have content entries in Contentful
// and can already use the rebranded version of our SubscriptionPage
const TiersWithContent = [FREE, SELF_SERVICE, ENTERPRISE, ENTERPRISE_HIGH_DEMAND];

function isOrganizationEnterprise(organization, basePlan) {
  const isLegacyOrg = isLegacyOrganization(organization);

  return isLegacyOrg ? isLegacyEnterprise(organization) : isEnterprisePlan(basePlan);
}

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
  const { basePlan, addOnPlan, spacePlans } = findAllPlans(plansWithSpaces.items, accessibleSpaces);

  const usersMeta = calcUsersMeta({ basePlan, numMemberships });

  setSpacePlans(spacePlans);

  const isSubscriptionPageRebrandingEnabled = await getVariation(
    FLAGS.SUBSCRIPTION_PAGE_REBRANDING
  );
  const orgIsEnterprise = isOrganizationEnterprise(organization, basePlan);

  return {
    basePlan,
    addOnPlan,
    usersMeta,
    numMemberships,
    organization,
    productRatePlans,
    isSubscriptionPageRebrandingEnabled,
    orgIsEnterprise,
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

  if (isLoading) {
    return <LoadingState testId="subs-page-loading" />;
  }

  if (error) {
    return <ForbiddenPage />;
  }

  return (
    <>
      <DocumentTitle title="Subscription" />
      <Workbench>
        <Workbench.Header
          icon={<ProductIcon icon="Subscription" size="large" />}
          title="Subscription"
          actions={
            <ContactUsButton testId="contact-us" disabled={isLoading} isLink>
              Questions or feedback? Contact us
            </ContactUsButton>
          }
        />
        {/**
         * the workbench needs this 'position relative' or it will render double scrollbars
         * when its children have 'flex-direction: column'
         * */}
        <Workbench.Content className={css({ position: 'relative' })}>
          {/**
           * if the feature flag is on and the base plan content is already created in Contentful, show one of the rebranded Subscription Pages
           * Otherwise, show the generic Subscription Page
           * */}
          {data.isSubscriptionPageRebrandingEnabled &&
          TiersWithContent.includes(data.basePlan.customerType) ? (
            <>
              {data.orgIsEnterprise && (
                <EnterpriseSubscriptionPage
                  basePlan={data.basePlan}
                  usersMeta={data.usersMeta}
                  organization={data.organization}
                  memberAccessibleSpaces={data.memberAccessibleSpaces}
                  grandTotal={grandTotal}
                  initialLoad={isLoading}
                  spacePlans={spacePlans}
                  onSpacePlansChange={(newSpacePlans) => setSpacePlans(newSpacePlans)}
                />
              )}
              {!data.orgIsEnterprise && (
                <NonEnterpriseSubscriptionPage
                  basePlan={data.basePlan}
                  addOnPlan={data.addOnPlan}
                  usersMeta={data.usersMeta}
                  organization={data.organization}
                  grandTotal={grandTotal}
                  initialLoad={isLoading}
                  spacePlans={spacePlans}
                  onSpacePlansChange={(newSpacePlans) => setSpacePlans(newSpacePlans)}
                />
              )}
            </>
          ) : (
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
            />
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}

SubscriptionPageRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
