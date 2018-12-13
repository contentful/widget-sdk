import React from 'react';
import PropTypes from 'prop-types';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getMemberships } from 'access_control/OrganizationMembershipRepository.es6';

import UserInvitationsList from './UserInvitationsList.es6';
import { membershipExistsParam } from '../UserInvitationUtils.es6';

const InvitationListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  return Promise.all([
    getMemberships(endpoint, { limit: 0, [membershipExistsParam]: true }).then(({ total }) => total)
  ]);
});

export default class UserInvitationsListRouter extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

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
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            const [membershipsCount] = data;

            return <UserInvitationsList orgId={orgId} membershipsCount={membershipsCount} />;
          }}
        </InvitationListFetcher>
      </OrgAdminOnly>
    );
  }
}
