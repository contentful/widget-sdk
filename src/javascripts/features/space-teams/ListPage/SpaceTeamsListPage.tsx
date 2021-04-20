import React, { useCallback, useReducer } from 'react';
import { filter } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { fetchAllWithIncludes } from 'data/CMA/FetchAll';
import { createSpaceEndpoint } from 'data/EndpointFactory';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { useAsync } from 'core/hooks';
import resolveLinks from 'data/LinkResolver';
import {
  getTeamsSpaceMembershipsOfSpace,
  updateTeamSpaceMembership,
  deleteTeamSpaceMembership,
  getAllTeams,
} from 'access_control/TeamRepository';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import * as SpaceMembershipRepository from 'access_control/SpaceMembershipRepository';
import DocumentTitle from 'components/shared/DocumentTitle';

import { SpaceTeamsPagePresentation } from './SpaceTeamsPagePresentation';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { reducer, SpaceTeamsReducerActionType, initialState } from './reducer';
import { isAdmin, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { SpaceMembership } from 'core/services/SpaceEnvContext/types';

const fetch = (spaceId, organizationId, dispatch) => async () => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const orgEndpoint = createOrganizationEndpoint(organizationId);

  const [
    teamSpaceMemberships,
    spaceMemberships,
    { items: availableRoles },
    teams,
  ] = await Promise.all([
    getTeamsSpaceMembershipsOfSpace(spaceEndpoint),
    SpaceMembershipRepository.create(spaceEndpoint).getAll(),
    fetchAllWithIncludes(spaceEndpoint, ['roles'], 100),
    getAllTeams(orgEndpoint),
  ]);
  dispatch({
    type: SpaceTeamsReducerActionType.INITIAL_FETCH_SUCCESS,
    payload: { teamSpaceMemberships, availableRoles, teams, spaceMemberships },
  });
};

type UseFetchingResponse = {
  state: typeof initialState;
  error: ErrorConstructor | undefined;
  isLoading: boolean;
};

const useFetching = (
  spaceId,
  organizationId
): [
  UseFetchingResponse,
  (membership: SpaceMembership, selectedRoleIds: string[]) => void,
  (membership: SpaceMembership) => void
] => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoading, error } = useAsync(useCallback(fetch(spaceId, organizationId, dispatch), []));

  const onUpdateTeamSpaceMembership = useCallback(
    async (membership, selectedRoleIds) => {
      dispatch({ type: SpaceTeamsReducerActionType.OPERATION_PENDING });

      const { availableRoles } = state;
      const newRoles = availableRoles.filter(({ sys: { id } }) => selectedRoleIds.includes(id));
      const {
        sys: {
          team: { name: teamName },
        },
      } = membership;

      try {
        const updatedMembership = await updateTeamSpaceMembership(
          createSpaceEndpoint(spaceId),
          membership,
          selectedRoleIds[0] === ADMIN_ROLE_ID,
          newRoles.map(({ sys: { id } }) => ({
            sys: { id, type: 'Link', linkType: 'Role' },
          }))
        );
        dispatch({
          type: SpaceTeamsReducerActionType.UPDATE_SUCCESS,
          payload: { updatedMembership },
        });
        Notification.success('Team role successfully changed');
      } catch (e) {
        Notification.error(`Could not change roles for team ${teamName}`);
        dispatch({ type: SpaceTeamsReducerActionType.ERROR });
        throw e;
      }
    },
    [spaceId, state]
  );

  const onRemoveTeamSpaceMembership = useCallback(
    async (membership) => {
      dispatch({ type: SpaceTeamsReducerActionType.OPERATION_PENDING });
      const {
        sys: {
          id: membershipId,
          team: { name: teamName },
        },
      } = membership;

      try {
        await deleteTeamSpaceMembership(createSpaceEndpoint(spaceId), membership);
        dispatch({ type: SpaceTeamsReducerActionType.DELETE_SUCCESS, payload: { membershipId } });
        Notification.success(`Successfully removed team ${teamName}`);
      } catch (e) {
        Notification.error(`Could not remove team ${teamName}`);
        dispatch({ type: SpaceTeamsReducerActionType.ERROR });
        throw e;
      }
    },
    [spaceId]
  );

  return [{ state, isLoading, error }, onUpdateTeamSpaceMembership, onRemoveTeamSpaceMembership];
};

const SpaceTeamsListPage = () => {
  // TODO: Move this to mapInjectedToProps/a routing component
  //
  // This cannot be done yet due to spaceMember being an object which causes overflows
  const {
    currentOrganizationId: organizationId,
    currentSpace,
    currentSpaceId,
  } = useSpaceEnvContext();
  const spaceMember = getSpaceMember(currentSpace);
  const readOnly = !isAdmin(currentSpace);

  const [
    {
      state: { teamSpaceMemberships, spaceMemberships, teams, availableRoles, isPending },
      error,
      isLoading,
    },
    onUpdateTeamSpaceMembership,
    onRemoveTeamSpaceMembership,
  ] = useFetching(currentSpaceId, organizationId);

  if (!getSectionVisibility().teams) {
    return <ForbiddenPage />;
  }

  const [
    {
      sys: { relatedMemberships: currentUserSpaceMemberships },
    },
  ] = resolveLinks({
    paths: ['sys.relatedMemberships'],
    includes: { TeamSpaceMembership: teamSpaceMemberships },
    items: [spaceMember],
  });

  const currentUserAdminSpaceMemberships = filter(currentUserSpaceMemberships, { admin: true });

  if (error) {
    return (
      <div>
        <UnknownErrorMessage />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Teams" />
      {/* @ts-ignore */}
      <SpaceTeamsPagePresentation
        {...{
          teamSpaceMemberships,
          spaceMemberships,
          availableRoles,
          readOnly,
          teams,
          isLoading,
          isPending,
          onUpdateTeamSpaceMembership,
          onRemoveTeamSpaceMembership,
          currentUserAdminSpaceMemberships,
        }}
      />
    </>
  );
};

export { SpaceTeamsListPage };
