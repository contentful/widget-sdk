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
