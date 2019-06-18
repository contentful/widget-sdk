import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { getSpace } from 'services/TokenStore.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllTeams } from 'access_control/TeamRepository.es6';
import { getInstance as createRoleRepo } from 'access_control/RoleRepository.es6';
import AddTeamsPage from './AddTeamsPage.es6';
import { getModule } from 'NgRegistry.es6';

const fetch = (spaceId, onReady) => async () => {
  const spaceContext = getModule('spaceContext');

  const {
    organization: {
      sys: { id: organizationId }
    }
  } = await getSpace(spaceId);

  const endpoint = createOrganizationEndpoint(organizationId);
  const roleRepo = createRoleRepo(spaceContext.space);

  const [roles, teams] = await Promise.all([roleRepo.getAll(), getAllTeams(endpoint)]);

  onReady();

  return { teams, roles };
};

export default function AddTeamsRouter({ onReady, spaceId }) {
  const { error, data } = useAsync(useCallback(fetch(spaceId, onReady), [spaceId]));

  return (
    <>
      <DocumentTitle title="Add teams" />
      {error && <ForbiddenPage />}
      {data && <AddTeamsPage spaceId={spaceId} {...data} />}
    </>
  );
}

AddTeamsRouter.propTypes = {
  onReady: PropTypes.func.isRequired,
  spaceId: PropTypes.string.isRequired
};
