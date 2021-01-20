import React from 'react';
import PropTypes from 'prop-types';
import { UsersList } from './UsersList';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository';
import { getAllTeams } from 'access_control/TeamRepository';
import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LocationProvider } from 'core/services/LocationContext';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';

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
    getOrgFeature(orgId, 'teams', false),
  ];

  return Promise.all(promises);
});

export default class UserListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <UserListFetcher orgId={orgId}>
          {({ isLoading, isError, data = [] }) => {
            if (isLoading) {
              return (
                <EmptyStateContainer>
                  <FetcherLoading /> {/* maybe we would like to refactor this component */}
                </EmptyStateContainer>
              );
            }
            if (isError) {
              return <StateRedirect path="spaces.detail.entries.list" />;
            }

            const [spaces, roles, teams, org, hasTeamsFeature] = data;

            return (
              <>
                <DocumentTitle title="Users" />
                <LocationProvider>
                  <UsersList
                    spaces={spaces}
                    spaceRoles={roles}
                    orgId={orgId}
                    teams={teams}
                    hasSsoEnabled={org && org.hasSsoEnabled}
                    hasTeamsFeature={hasTeamsFeature}
                  />
                </LocationProvider>
              </>
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
