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

import { AddTeamsPageContent } from './AddTeamsPageContent';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { TeamProps, TeamSpaceMembership } from 'contentful-management/types';
import { Role, SpaceEnv } from 'core/services/SpaceEnvContext/types';

type FetchResponseProps = {
  teams: TeamProps[];
  teamSpaceMemberships: TeamSpaceMembership[];
  roles: Role[];
};

const fetch = (spaceId: string, organizationId: string, space: SpaceEnv) => async (): Promise<
  FetchResponseProps
> => {
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

const AddTeamsPage = () => {
  const { currentSpaceId, currentOrganizationId, currentSpace } = useSpaceEnvContext();
  const { isLoading, error, data } = useAsync(
    useCallback(
      fetch(currentSpaceId as string, currentOrganizationId as string, currentSpace as SpaceEnv),
      [currentSpaceId, currentOrganizationId, currentSpace]
    )
  );

  const hasAccess = getSectionVisibility().teams;
  const hasError = error || !data;

  let page;

  if (isLoading) {
    return <FetcherLoading />;
  }

  if (!hasError) {
    page = (
      <AddTeamsPageContent spaceId={currentSpaceId as string} {...(data as FetchResponseProps)} />
    );
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
};

export { AddTeamsPage };
