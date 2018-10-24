import React from 'react';
import PropTypes from 'prop-types';
import UserList from './UsersList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import createResourceService from 'services/ResourceService.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import { getOrganization } from 'services/TokenStore.es6';

const UserListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const resources = createResourceService(orgId, 'organization');
  return Promise.all([
    resources.get('organizationMembership'),
    getAllSpaces(endpoint),
    getAllRoles(endpoint),
    getOrganization(orgId)
  ]);
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

            const [resource, spaces, roles, org] = data;

            return (
              <UserList
                resource={resource}
                spaces={spaces}
                spaceRoles={roles}
                orgId={orgId}
                hasSsoEnabled={org.hasSsoEnabled}
              />
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
