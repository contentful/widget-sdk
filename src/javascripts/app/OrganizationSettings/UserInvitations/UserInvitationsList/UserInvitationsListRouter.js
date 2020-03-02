import React from 'react';
import PropTypes from 'prop-types';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getMemberships } from 'access_control/OrganizationMembershipRepository';

import UserInvitationsList from './UserInvitationsList';
import { membershipExistsParam } from '../UserInvitationUtils';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getVariation } from 'LaunchDarkly';
import { PENDING_ORG_MEMBERSHIPS } from 'featureFlags';
import { go } from 'states/Navigator';

const InvitationListFetcher = createFetcherComponent(async ({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  const hasPendingMembershipsEnabled = await getVariation(PENDING_ORG_MEMBERSHIPS, {
    organizationId: orgId
  });

  if (hasPendingMembershipsEnabled) {
    // Redirect to the user list if the org has the pending memberships feature.
    // This component will be removed once the feature reached general availability.
    go({ path: ['account', 'organizations', 'users', 'list'] });
    return [0];
  }

  return Promise.all([
    getMemberships(endpoint, { limit: 0, [membershipExistsParam]: true }).then(({ total }) => total)
  ]);
});

export default class UserInvitationsListRouter extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    context: PropTypes.any
  };

  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <InvitationListFetcher orgId={orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading invitations..." />;
            }

            if (isError) {
              return <StateRedirect path="spaces.detail.entries.list" />;
            }

            const [membershipsCount] = data;

            return (
              <React.Fragment>
                <DocumentTitle title="Invitations" />
                <UserInvitationsList orgId={orgId} membershipsCount={membershipsCount} />
              </React.Fragment>
            );
          }}
        </InvitationListFetcher>
      </OrgAdminOnly>
    );
  }
}
