import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { findIndex, clone, filter } from 'lodash';
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

import styles from './styles';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin, getSpaceMember } from 'core/services/SpaceEnvContext/utils';

const initialState = {
  isPending: false,
  teamSpaceMemberships: [],
  teams: [],
  availableRoles: [],
};

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'ERROR':
      return { ...state, error: true, isPending: false };
    case 'INITIAL_FETCH_SUCCESS': {
      const { teamSpaceMemberships, spaceMemberships, availableRoles, teams } = payload;
      const sortedTeamSpaceMemberships = teamSpaceMemberships.sort(
        (
          {
            sys: {
              team: { name: nameA },
            },
          },
          {
            sys: {
              team: { name: nameB },
            },
          }
        ) => nameA.localeCompare(nameB)
      );
      return {
        ...state,
        availableRoles,
        teams,
        teamSpaceMemberships: sortedTeamSpaceMemberships,
        spaceMemberships,
        error: false,
      };
    }
    case 'OPERATION_PENDING': {
      return { ...state, isPending: true };
    }
    case 'UPDATE_SUCCESS': {
      const { updatedMembership } = payload;
      const { teamSpaceMemberships, availableRoles } = state;
      const [updatedMembershipWithRoles] = resolveLinks({
        paths: ['roles'],
        includes: { Role: availableRoles },
        items: [updatedMembership],
      });
      const index = findIndex(teamSpaceMemberships, { sys: { id: updatedMembership.sys.id } });
      const oldMembership = teamSpaceMemberships[index];
      const updatedMembershipResolvedLinks = {
        ...updatedMembershipWithRoles,
        sys: { ...updatedMembershipWithRoles.sys, team: oldMembership.sys.team },
      };

      const updatedTeamSpaceMemberships = clone(teamSpaceMemberships);
      updatedTeamSpaceMemberships.splice(index, 1, updatedMembershipResolvedLinks);
      return { ...state, teamSpaceMemberships: updatedTeamSpaceMemberships, isPending: false };
    }
    case 'DELETE_SUCCESS': {
      const { teamSpaceMemberships } = state;
      const { membershipId } = payload;
      return {
        ...state,
        teamSpaceMemberships: teamSpaceMemberships.filter(({ sys: { id } }) => id !== membershipId),
        isPending: false,
      };
    }
    default:
      return state;
  }
};

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
    type: 'INITIAL_FETCH_SUCCESS',
    payload: { teamSpaceMemberships, availableRoles, teams, spaceMemberships },
  });
};

const useFetching = (spaceId, organizationId) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoading, error } = useAsync(useCallback(fetch(spaceId, organizationId, dispatch), []));

  const onUpdateTeamSpaceMembership = useCallback(
    async (membership, selectedRoleIds) => {
      dispatch({ type: 'OPERATION_PENDING' });

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
        dispatch({ type: 'UPDATE_SUCCESS', payload: { updatedMembership } });
        Notification.success('Team role successfully changed');
      } catch (e) {
        Notification.error(`Could not change roles for team ${teamName}`);
        dispatch({ type: 'ERROR' });
        throw e;
      }
    },
    [spaceId, state]
  );

  const onRemoveTeamSpaceMembership = useCallback(
    async (membership) => {
      dispatch({ type: 'OPERATION_PENDING' });
      const {
        sys: {
          id: membershipId,
          team: { name: teamName },
        },
      } = membership;

      try {
        await deleteTeamSpaceMembership(createSpaceEndpoint(spaceId), membership);
        dispatch({ type: 'DELETE_SUCCESS', payload: { membershipId } });
        Notification.success(`Successfully removed team ${teamName}`);
      } catch (e) {
        Notification.error(`Could not remove team ${teamName}`);
        dispatch({ type: 'ERROR' });
        throw e;
      }
    },
    [spaceId]
  );

  return [{ state, isLoading, error }, onUpdateTeamSpaceMembership, onRemoveTeamSpaceMembership];
};

const SpaceTeamsPage = ({ spaceId }) => {
  // TODO: Move this to mapInjectedToProps/a routing component
  //
  // This cannot be done yet due to spaceMember being an object which causes overflows
  const { currentOrganizationId: organizationId, currentSpace } = useSpaceEnvContext();
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
  ] = useFetching(spaceId, organizationId);

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
      <div className={styles.contentAlignment}>
        <UnknownErrorMessage />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Teams" />
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

SpaceTeamsPage.propTypes = {
  spaceId: PropTypes.string,
};

export default SpaceTeamsPage;
