import React, { useCallback, useContext } from 'react';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { getPlansWithSpaces, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import type { Organization } from 'classes/spaceContextTypes';
import DocumentTitle from 'components/shared/DocumentTitle';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { LoadingState } from 'features/loading-state';
import createResourceService from 'services/ResourceService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization, getSpaces } from 'services/TokenStore';
import { calcUsersMeta } from 'utils/SubscriptionUtils';
import { isOrganizationOnTrial } from 'features/trials';
import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import ContactUsButton from 'ui/Components/ContactUsButton';

import { findAllPlans } from '../utils';
import { NonEnterpriseSubscriptionPage } from '../components/NonEnterpriseSubscriptionPage';
import { EnterpriseSubscriptionPage } from '../components/EnterpriseSubscriptionPage';
import { actions, OrgSubscriptionContext } from '../context';
import type { OrgSubscriptionReducerAction } from '../context';
import type { UsersMeta } from '../types';

async function fetchNumMemberships(orgEndpoint) {
  const resources = createResourceService(orgEndpoint);
  const membershipsResource = await resources.get('organization_membership');
  return (membershipsResource as { usage: number }).usage;
}

interface SubscriptionPageFetch {
  usersMeta?: UsersMeta;
  organization: Organization;
  orgIsEnterprise?: boolean;
  memberAccessibleSpaces?: unknown[];
}

async function fetch(
  organizationId: string,
  dispatch: React.Dispatch<OrgSubscriptionReducerAction>
): Promise<SubscriptionPageFetch> {
  const organization = await getOrganization(organizationId);
  const endpoint = createOrganizationEndpoint(organizationId);

  if (!isOwnerOrAdmin(organization)) {
    // if user is a member of a org on Enterprise Trial
    // we show them the subscription page we reduced information
    if (isOrganizationOnTrial(organization)) {
      const memberAccessibleSpaces = await getAllSpaces(endpoint);

      return {
        organization,
        memberAccessibleSpaces,
      };
    }

    // if the user is a member of an org not on Trial
    // we show them an error
    throw new Error();
  }

  const [plansWithSpaces, numMemberships] = await Promise.all([
    getPlansWithSpaces(endpoint),
    fetchNumMemberships(endpoint),
  ]);

  if (!plansWithSpaces) {
    throw new Error();
  }

  // spaces that current user has access to
  const accessibleSpaces = await getSpaces();

  // separating all the different types of plans
  const { basePlan, addOnPlans, spacePlans } = findAllPlans(
    plansWithSpaces.items,
    accessibleSpaces
  );

  const usersMeta = calcUsersMeta({ basePlan, numMemberships });

  const orgIsEnterprise = isEnterprisePlan(basePlan);

  dispatch({
    type: actions.SET_PLANS_AND_MEMBERSHIPS,
    payload: { basePlan, addOnPlans, spacePlans, numMemberships },
  });

  return {
    usersMeta,
    organization,
    orgIsEnterprise,
  };
}

interface SubscriptionPageRouteProps {
  orgId: string;
}

export function SubscriptionPageRoute({ orgId }: SubscriptionPageRouteProps) {
  const {
    state: { basePlan },
    dispatch,
  } = useContext(OrgSubscriptionContext);

  const { isLoading, error, data } = useAsync<SubscriptionPageFetch>(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => fetch(orgId, dispatch), [])
  );

  if (isLoading) {
    return <LoadingState testId="subs-page-loading" />;
  }

  if (error || !data || !basePlan) {
    return <ForbiddenPage data-test-id="forbidden-page" />;
  }

  return (
    <>
      <DocumentTitle title="Subscription" />
      <Workbench>
        <Workbench.Header
          icon={<ProductIcon icon="Subscription" size="large" />}
          title="Subscription"
          actions={
            <ContactUsButton testId="contact-us" isLink>
              Questions or feedback? Contact us
            </ContactUsButton>
          }
        />
        {/**
         * the workbench needs this 'position relative' or it will render double scrollbars
         * when its children have 'flex-direction: column'
         * */}
        <Workbench.Content className={css({ position: 'relative' })}>
          {data.orgIsEnterprise && (
            <EnterpriseSubscriptionPage
              usersMeta={data.usersMeta}
              organization={data.organization}
              memberAccessibleSpaces={data.memberAccessibleSpaces ?? []}
              // Currently this is the only way to know if a basePlan is used internally at Contentful
              isInternalBasePlan={/internal/i.test(basePlan.productName)}
            />
          )}
          {!data.orgIsEnterprise && (
            <NonEnterpriseSubscriptionPage
              usersMeta={data.usersMeta}
              organization={data.organization}
            />
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}
