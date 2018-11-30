import React from 'react';
import PropTypes from 'prop-types';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import { FetcherLoading } from '../../../common/createFetcherComponent.es6';
import StateRedirect from '../../../common/StateRedirect.es6';
import createFetcherComponent from '../../../common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from '../../../../data/EndpointFactory.es6';
import { fetchAll } from '../../../../data/CMA/FetchAll.es6';
import { getMemberships } from '../../../../access_control/OrganizationMembershipRepository.es6';

import ResolveLinks from '../../LinkResolver.es6';
import InvitationsList from '../InvitationsList.es6';

const InvitationListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const includePaths = ['sys.user'];

  return Promise.all([
    fetchAll(endpoint, ['invitations'], 100, { 'status[eq]': 'pending' }),
    getMemberships(endpoint, { include: includePaths }).then(({ items, includes }) =>
      ResolveLinks({ paths: includePaths, items, includes })
    )
  ]);
});

export default class InvitationListRoute extends React.Component {
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

            const [invitations, memberships] = data;

            return (
              <InvitationsList
                invitations={invitations}
                pendingMemberships={memberships.filter(
                  ({
                    sys: {
                      user: { firstName, lastName }
                    }
                  }) => firstName === null && lastName === null
                )}
              />
            );
          }}
        </InvitationListFetcher>
      </OrgAdminOnly>
    );
  }
}
