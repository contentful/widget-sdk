import React, { useCallback } from 'react';
import { useAsync } from 'core/hooks';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getAllTeams, getTeamsSpaceMembershipsOfSpace } from 'access_control/TeamRepository';
import { getInstance as createRoleRepo } from 'access_control/RoleRepository';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { FetcherLoading } from 'app/common/createFetcherComponent';

import AddTeamsPage from './AddTeamsPage';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const fetch = (spaceId, organizationId, space) => async () => {
  const orgEndpoint = createOrganizationEndpoint(organizationId);
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const roleRepo = createRoleRepo(space);

  const [roles, teams, teamSpaceMemberships] = await Promise.all([
    roleRepo.getAll(),
    getAllTeams(orgEndpoint),
    getTeamsSpaceMembershipsOfSpace(spaceEndpoint),
  ]);

  return { teams, teamSpaceMemberships, roles };
};

export default function AddTeamsRouter() {
  const { currentSpaceId, currentOrganizationId, currentSpace } = useSpaceEnvContext();
  const { isLoading, error, data } = useAsync(
    useCallback(fetch(currentSpaceId, currentOrganizationId, currentSpace), [
      currentSpaceId,
      currentOrganizationId,
      currentSpace,
    ])
  );

  const hasAccess = getSectionVisibility().teams;
  const hasError = error || !data;

  let page;

  if (isLoading) {
    return <FetcherLoading />;
  }

  if (!hasError) {
    page = <AddTeamsPage spaceId={currentSpaceId} {...data} />;
  }

  if (!hasAccess) {
    page = <ForbiddenPage />;
  }

  return (
    <>
      <DocumentTitle title="Add teams" />
      {page || <UnknownErrorMessage />}
    </>
  );
}
