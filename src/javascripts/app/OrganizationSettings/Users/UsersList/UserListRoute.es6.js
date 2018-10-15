import React from 'react';
import PropTypes from 'prop-types';
import UserList from './UsersList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import createResourceService from 'services/ResourceService.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import $stateParams from '$stateParams';

const UserListFetcher = createFetcherComponent(() => {
  const orgId = $stateParams.orgId;
  const endpoint = createOrganizationEndpoint(orgId);
  const resources = createResourceService(orgId, 'organization');
  return Promise.all([
    resources.get('organization_membership'),
    getAllSpaces(endpoint),
    getAllRoles(endpoint)
  ]);
});

export default class UserListRoute extends React.Component {
  static propTypes = {
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.context.ready = true;
  }

  render() {
    return (
      <OrgAdminOnly>
        <UserListFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading users..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            const [resource, spaces, roles] = data;

            return (
              <UserList
                resource={resource}
                spaces={spaces}
                spaceRoles={roles}
                orgId={$stateParams.orgId}
              />
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
