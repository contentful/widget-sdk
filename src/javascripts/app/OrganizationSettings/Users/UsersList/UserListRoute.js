import React, { useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { UsersList } from './UsersList';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository';
import { getAllTeams } from 'access_control/TeamRepository';
import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { useAsyncFn } from 'core/hooks';

function UsersListRoute(props) {
  const { orgId } = props;

  const fetchData = useCallback(() => {
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
  }, [orgId]);

  const [{ data, error }, load] = useAsyncFn(fetchData);

  useEffect(() => {
    load();
  }, [orgId, load]);

  if (!data) {
    return (
      <EmptyStateContainer>
        <FetcherLoading /> {/* maybe we would like to refactor this component */}
      </EmptyStateContainer>
    );
  }

  if (error) {
    return <StateRedirect path="account.organizations.subscription_new.overview" />;
  }

  const [spaces, roles, teams, org, hasTeamsFeature] = data;

  return (
    <OrgAdminOnly orgId={orgId}>
      <DocumentTitle title="Users" />
      <UsersList
        spaces={spaces}
        spaceRoles={roles}
        orgId={orgId}
        teams={teams}
        hasSsoEnabled={org && org.hasSsoEnabled}
        hasTeamsFeature={hasTeamsFeature}
      />
    </OrgAdminOnly>
  );
}

UsersListRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};

export default memo(UsersListRoute);
