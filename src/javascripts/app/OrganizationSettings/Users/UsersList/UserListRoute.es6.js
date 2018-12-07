import React from 'react';
import PropTypes from 'prop-types';
import UsersList from './UsersList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import {
  getAllSpaces,
  getAllRoles,
  getMemberships
} from 'access_control/OrganizationMembershipRepository.es6';
import { getOrganization } from 'services/TokenStore.es6';
import createResourceService from 'services/ResourceService.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { BV_USER_INVITATIONS } from 'featureFlags.es6';

const UserListFetcher = createFetcherComponent(async ({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const resources = createResourceService(orgId, 'organization');

  const newUserInvitationsEnabled = getCurrentVariation(BV_USER_INVITATIONS);

  const promises = [
    getAllSpaces(endpoint),
    getAllRoles(endpoint),
    getOrganization(orgId),
    newUserInvitationsEnabled
  ];

  if (newUserInvitationsEnabled) {
    promises.push(
      getMemberships(endpoint, { 'sys.user.firstName[ne]': '' }).then(({ total }) => total)
    );
  } else {
    promises.push(resources.get('organizationMembership').then(({ usage }) => usage));
  }

  return Promise.all(promises);
});

export default class UserListRoute extends React.Component {
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
        <UserListFetcher orgId={orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading users..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            const [spaces, roles, org, newUserInvitationsEnabled, numberOrgMemberships] = data;

            return (
              <UsersList
                numberOrgMemberships={numberOrgMemberships}
                spaces={spaces}
                spaceRoles={roles}
                orgId={orgId}
                hasSsoEnabled={org.hasSsoEnabled}
                newUserInvitationsEnabled={newUserInvitationsEnabled}
              />
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
