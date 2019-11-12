import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSpace } from 'services/TokenStore';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getAllTeams, getTeamsSpaceMembershipsOfSpace } from 'access_control/TeamRepository';
import { getInstance as createRoleRepo } from 'access_control/RoleRepository';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { getModule } from 'NgRegistry';

import AddTeamsPage from './AddTeamsPage';

const fetch = (spaceId, onReady) => async () => {
  const spaceContext = getModule('spaceContext');

  const {
    organization: {
      sys: { id: organizationId }
    }
  } = await getSpace(spaceId);

  const orgEndpoint = createOrganizationEndpoint(organizationId);
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const roleRepo = createRoleRepo(spaceContext.space);

  let roles;
  let teams;
  let teamSpaceMemberships;

  try {
    [roles, teams, teamSpaceMemberships] = await Promise.all([
      roleRepo.getAll(),
      getAllTeams(orgEndpoint),
      getTeamsSpaceMembershipsOfSpace(spaceEndpoint)
    ]);
  } finally {
    onReady();
  }

  return { teams, teamSpaceMemberships, roles };
};

export default function AddTeamsRouter({ onReady, spaceId }) {
  const { error, data } = useAsync(useCallback(fetch(spaceId, onReady), [spaceId]));

  const hasAccess = getSectionVisibility().teams;
  const hasError = error || !data;

  let page;
  if (!hasError) {
    page = <AddTeamsPage spaceId={spaceId} {...data} />;
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

AddTeamsRouter.propTypes = {
  onReady: PropTypes.func.isRequired,
  spaceId: PropTypes.string.isRequired
};
