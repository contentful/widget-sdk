import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { findIndex, clone, filter } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { fetchAllWithIncludes } from 'data/CMA/FetchAll.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import useAsync from 'app/common/hooks/useAsync.es6';
import resolveLinks from 'data/LinkResolver.es6';
import { getModule } from 'NgRegistry.es6';
import {
  getTeamsSpaceMembershipsOfSpace,
  updateTeamSpaceMembership,
  getAllTeams
} from 'access_control/TeamRepository.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import { ADMIN_ROLE_ID } from 'access_control/constants.es6';

import styles from './styles.es6';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation.es6';

const spaceContext = getModule('spaceContext');

const initialState = {
  isPending: false,
  memberships: [],
  teams: [],
  availableRoles: []
};

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'ERROR':
      return { ...state, error: true, isPending: false };
    case 'INITIAL_FETCH_SUCCESS': {
      const {
        data: [memberships, availableRoles, teams]
      } = payload;
      const sortedMemberships = memberships.sort(
        (
          {
            sys: {
              team: { name: nameA }
            }
          },
          {
            sys: {
              team: { name: nameB }
            }
          }
        ) => nameA.localeCompare(nameB)
      );
      return { ...state, availableRoles, teams, memberships: sortedMemberships, error: false };
    }
    case 'OPERATION_PENDING': {
      return { ...state, isPending: true };
    }
    case 'UPDATE_SUCCESS': {
      const { updatedMembership } = payload;
      const { memberships, availableRoles } = state;
      const [updatedMembershipWithRoles] = resolveLinks({
        paths: ['roles'],
        includes: { Role: availableRoles },
        items: [updatedMembership]
      });
      const index = findIndex(memberships, { sys: { id: updatedMembership.sys.id } });
      const oldMembership = memberships[index];
      const updatedMembershipResolvedLinks = {
        ...updatedMembershipWithRoles,
        sys: { ...updatedMembershipWithRoles.sys, team: oldMembership.sys.team }
      };

      const updatedMemberships = clone(memberships);
      updatedMemberships.splice(index, 1, updatedMembershipResolvedLinks);
      return { ...state, memberships: updatedMemberships, isPending: false };
    }
    default:
      return state;
  }
};

const fetch = (spaceId, dispatch) => async () => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const spaceContext = getModule('spaceContext');
  const {
    sys: { id: orgId }
  } = spaceContext.organization;
  const orgEndpoint = createOrganizationEndpoint(orgId);

  const data = await Promise.all([
    getTeamsSpaceMembershipsOfSpace(spaceEndpoint),
    (await fetchAllWithIncludes(spaceEndpoint, ['roles'], 100)).items,
    getAllTeams(orgEndpoint)
  ]);
  dispatch({ type: 'INITIAL_FETCH_SUCCESS', payload: { data } });
};

const useFetching = spaceId => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoading, error } = useAsync(useCallback(fetch(spaceId, dispatch), []));

  const onUpdateTeamSpaceMembership = async (membership, selectedRoleIds) => {
    dispatch({ type: 'OPERATION_PENDING' });

    const { availableRoles } = state;
    const newRoles = availableRoles.filter(({ sys: { id } }) => selectedRoleIds.includes(id));
    const {
      sys: {
        team: { name: teamName }
      }
    } = membership;

    try {
      const updatedMembership = await updateTeamSpaceMembership(
        createSpaceEndpoint(spaceId),
        membership,
        selectedRoleIds[0] === ADMIN_ROLE_ID,
        newRoles.map(({ sys: { id } }) => ({
          sys: { id, type: 'Link', linkType: 'Role' }
        }))
      );
      dispatch({ type: 'UPDATE_SUCCESS', payload: { updatedMembership } });
      Notification.success(`Successfully changed roles for Team ${teamName}`);
    } catch (e) {
      Notification.error(`Could not change roles for Team ${teamName}`);
      dispatch({ type: 'ERROR' });
      throw e;
    }
  };
  return [{ ...state, isLoading, error }, onUpdateTeamSpaceMembership];
};

const SpaceTeamsPage = ({ spaceId, onReady }) => {
  onReady();
  const [
    { error, memberships, teams, availableRoles, isLoading, isPending },
    onUpdateTeamSpaceMembership
  ] = useFetching(spaceId);

  if (!getSectionVisibility().teams) {
    return <ForbiddenPage />;
  }
  const readOnly = !spaceContext.getData('spaceMember.admin', false);
  const spaceMember = spaceContext.getData('spaceMember');
  const [{ relatedMemberships: currentUserSpaceMemberships }] = resolveLinks({
    paths: ['relatedMemberships'],
    includes: { TeamSpaceMembership: memberships },
    items: [spaceMember]
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
    <SpaceTeamsPagePresentation
      {...{
        memberships,
        availableRoles,
        readOnly,
        teams,
        isLoading,
        isPending,
        onUpdateTeamSpaceMembership,
        currentUserAdminSpaceMemberships
      }}
    />
  );
};

SpaceTeamsPage.propTypes = {
  spaceId: PropTypes.string.isRequired,
  onReady: PropTypes.func.isRequired
};

export default SpaceTeamsPage;
