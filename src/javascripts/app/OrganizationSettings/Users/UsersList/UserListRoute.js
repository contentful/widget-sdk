import React from 'react';
import PropTypes from 'prop-types';
import UsersList from './UsersList';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository';
import { getAllTeams } from 'access_control/TeamRepository';
import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getVariation } from 'LaunchDarkly';
import { PENDING_ORG_MEMBERSHIPS, SHOW_2FA_STATUS_FLAG } from 'featureFlags';

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
    getVariation(PENDING_ORG_MEMBERSHIPS, { organizationId: orgId }),
    getVariation(SHOW_2FA_STATUS_FLAG, { organizationId: orgId })
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

            const [
              spaces,
              roles,
              teams,
              org,
              hasTeamsFeature,
              hasPendingOrgMembershipsEnabled,
              has2FAStatusEnabled
            ] = data;

            return (
              <>
                <DocumentTitle title="Users" />
                <UsersList
                  spaces={spaces}
                  spaceRoles={roles}
                  orgId={orgId}
                  teams={teams}
                  hasSsoEnabled={org.hasSsoEnabled}
                  hasTeamsFeature={hasTeamsFeature}
                  hasPendingOrgMembershipsEnabled={hasPendingOrgMembershipsEnabled}
                  has2FAStatusEnabled={has2FAStatusEnabled}
                />
              </>
            );
          }}
        </UserListFetcher>
      </OrgAdminOnly>
    );
  }
}
