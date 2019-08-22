import React from 'react';
import PropTypes from 'prop-types';
import UsersList from './UsersList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import { getAllTeams } from 'access_control/TeamRepository.es6';
import { getOrganization } from 'services/TokenStore.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

const UserListFetcher = createFetcherComponent(({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const safeGetTeams = async () => {
    try {
      return await getAllTeams(endpoint);
    } catch {
      return [];
    }
  };
  const promises = [
    getAllSpaces(endpoint),
    getAllRoles(endpoint),
    safeGetTeams(),
    getOrganization(orgId),
    getOrgFeature(orgId, 'teams', false)
  ];

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

            const [spaces, roles, teams, org, hasTeamsFeature] = data;

            return (
              <React.Fragment>
                <DocumentTitle title="Users" />
                <UsersList
                  spaces={spaces}
                  spaceRoles={roles}
                  orgId={orgId}
                  teams={teams}
                  hasSsoEnabled={org.hasSsoEnabled}
                  hasTeamsFeature={hasTeamsFeature}
                />
              </React.Fragment>
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
