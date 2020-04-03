import React, { useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { Tabs, Tab, Button, Heading, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { createImmerReducer } from 'redux/utils/createImmerReducer';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';
import { useAsyncFn } from 'app/common/hooks/useAsync';
import { fetchAndResolve } from 'data/LinkResolver';
import { getAllSpaceMemberships } from 'access_control/OrganizationMembershipRepository';
import { getAllTeamMemberships, removeTeamMembership } from 'access_control/TeamRepository';
import { go } from 'states/Navigator';
import UserCard from '../UserCard';
import UserSpaceList from './UserSpaceList';
import UserTeamList from './UserTeamList';
import UserAttributes from './UserAttributes';
import ModalLauncher from 'app/common/ModalLauncher';
import AddToSpacesModal from 'app/OrganizationSettings/Users/common/AddToSpacesModal';
import EditSpaceMembershipModal from './EditSpaceMembershipModal';
import { getFullNameOrEmail } from 'app/OrganizationSettings/Users/UserUtils';
import NavigationIcon from 'ui/Components/NavigationIcon';
import AddToTeamsModal from '../common/AddToTeamsModal';

const styles = {
  tabs: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacingL,
  }),
};

const reducer = createImmerReducer({
  TAB_SELECTED: (state, action) => {
    state.selectedTab = action.payload;
  },
  SPACE_MEMBERSHIPS_FETCHED: (state, action) => {
    state.spaceMemberships = action.payload;
  },
  SPACE_MEMBERSHIPS_ADDED: (state, action) => {
    state.spaceMemberships = [...action.payload, ...state.spaceMembership];
  },
  SPACE_MEMBERSHIP_REMOVED: (state, action) => {
    state.spaceMemberships = state.spaceMemberships.filter(
      (membership) => membership.sys.space.sys.id !== action.payload.sys.space.sys.id
    );
  },
  SPACE_MEMBERSHIP_UPDATED: (state, action) => {
    const membershipId = action.payload.sys.id;
    const index = state.spaceMemberships.findIndex(
      (membership) => membership.sys.id === membershipId
    );
    state.spaceMemberships.splice(index, 1, action.payload);
  },
  TEAM_MEMBERSHIPS_FETCHED: (state, action) => {
    state.teamMemberships = action.payload;
  },
  TEAM_MEMBERSHIP_REMOVED: (state, action) => {
    state.teamMemberships = state.teamMemberships.filter(
      (membership) => membership.sys.id !== action.payload.sys.id
    );
  },
  ORG_ROLE_CHANGED: (state, action) => {
    state.membership.role = action.payload.role;
    state.membership.sys.version = action.payload.sys.version;
  },
});

const tabs = {
  SPACES: {
    label: 'Spaces',
  },
  TEAMS: {
    label: 'Teams',
  },
};

export default function UserDetails({
  initialMembership,
  isSelf,
  isOwner,
  orgId,
  hasTeamsFeature,
}) {
  const userId = initialMembership.sys.user.sys.id;

  const [{ membership, selectedTab, spaceMemberships, teamMemberships }, dispatch] = useReducer(
    reducer,
    {
      membership: initialMembership,
      spaceMemberships: [],
      teamMemberships: [],
      selectedTab: tabs.SPACES,
    }
  );

  const fetchSpaceMemberships = useCallback(async () => {
    const data = await getAllUserSpaceMemberships(userId, orgId);
    dispatch({ type: 'SPACE_MEMBERSHIPS_FETCHED', payload: data });
    return data;
  }, [userId, orgId]);

  const fetchTeamMemberships = useCallback(async () => {
    const data = await getAllUserTeamMemberships(initialMembership.sys.id, orgId, hasTeamsFeature);
    dispatch({ type: 'TEAM_MEMBERSHIPS_FETCHED', payload: data });
    return data;
  }, [initialMembership, orgId, hasTeamsFeature]);

  const [{ isLoading: isLoadingSpaceMemberships }, updateSpaceMemberships] = useAsyncFn(
    fetchSpaceMemberships
  );

  const [{ isLoading: isLoadingTeamMemberships }, updateTeamMemberships] = useAsyncFn(
    fetchTeamMemberships
  );

  useEffect(() => {
    updateSpaceMemberships();
    updateTeamMemberships();
  }, [updateSpaceMemberships, updateTeamMemberships]);

  const removeFromSpace = (spaceMembership) => {
    const repo = createRepoFromSpaceMembership(spaceMembership);
    repo.remove(spaceMembership);
    dispatch({ type: 'SPACE_MEMBERSHIP_REMOVED', payload: spaceMembership });
  };

  const removeFromTeam = async (teamMembership) => {
    const endpoint = createOrganizationEndpoint(orgId);
    await removeTeamMembership(endpoint, teamMembership);
    dispatch({ type: 'TEAM_MEMBERSHIP_REMOVED', payload: teamMembership });
  };

  const handleSpaceRoleChanged = useCallback(
    (updatedMembership) =>
      dispatch({ type: 'SPACE_MEMBERSHIP_UPDATED', payload: updatedMembership }),
    []
  );

  const editSpaceMembership = (spaceMembership) => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <EditSpaceMembershipModal
          membership={spaceMembership}
          onChange={handleSpaceRoleChanged}
          isShown={isShown}
          onClose={onClose}
        />
      );
    });
  };

  const handleAddToSpace = () => {
    const currentSpaces = spaceMemberships.map((sm) => sm.sys.space);
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <AddToSpacesModal
          user={initialMembership.sys.user}
          orgId={orgId}
          isShown={isShown}
          onClose={onClose}
          currentSpaces={currentSpaces}
          onAddedToSpaces={updateSpaceMemberships}
        />
      );
    });
  };

  const handleAddToTeams = () => {
    const currentTeams = teamMemberships.map((tm) => tm.sys.team);
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <AddToTeamsModal
          user={initialMembership.sys.user}
          orgId={orgId}
          orgMembershipId={initialMembership.sys.id}
          isShown={isShown}
          onClose={onClose}
          currentTeams={currentTeams}
          onAddedToTeams={updateTeamMemberships}
        />
      );
    });
  };

  const handleBackButtonClicked = () => {
    go({
      path: ['account', 'organizations', 'users', 'list'],
    });
  };

  return (
    <Workbench>
      <Workbench.Header
        title={getFullNameOrEmail(initialMembership.sys.user)}
        icon={<NavigationIcon icon="users" size="large" color="green" />}
        onBack={handleBackButtonClicked}
      />
      <Workbench.Content>
        <UserCard user={membership.sys.user} size="large" status={membership.status} />
        <UserAttributes
          membership={membership}
          isSelf={isSelf}
          isOwner={isOwner}
          orgId={orgId}
          onRoleChange={(membership) => dispatch({ type: 'ORG_ROLE_CHANGED', payload: membership })}
        />
        <div className={styles.tabs}>
          {hasTeamsFeature && (
            <Tabs>
              {Object.values(tabs).map((tab) => (
                <Tab
                  key={tab.label}
                  id={tab.label}
                  selected={selectedTab === tab}
                  onSelect={() => dispatch({ type: 'TAB_SELECTED', payload: tab })}>
                  {tab.label}
                </Tab>
              ))}
            </Tabs>
          )}
          {!hasTeamsFeature && <Heading>Spaces</Heading>}
          {selectedTab === tabs.SPACES && (
            <Button onClick={handleAddToSpace} testId="user-details.add-to-space-button">
              Add to spaces
            </Button>
          )}
          {selectedTab === tabs.TEAMS && (
            <Button onClick={handleAddToTeams} testId="user-details.add-to-teams-button">
              Add to teams
            </Button>
          )}
        </div>

        {selectedTab === tabs.SPACES && (
          <UserSpaceList
            user={membership.sys.user}
            memberships={spaceMemberships}
            loading={isLoadingSpaceMemberships}
            onSpaceMembershipRemove={removeFromSpace}
            onSpaceMembershipEdit={editSpaceMembership}
          />
        )}
        {selectedTab === tabs.TEAMS && (
          <UserTeamList
            user={membership.sys.user}
            memberships={teamMemberships}
            loading={isLoadingTeamMemberships}
            onTeamMembershipRemove={removeFromTeam}
          />
        )}
      </Workbench.Content>
    </Workbench>
  );
}

UserDetails.propTypes = {
  initialMembership: OrganizationMembershipPropType.isRequired,
  orgId: PropTypes.string.isRequired,
  isSelf: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  hasTeamsFeature: PropTypes.bool.isRequired,
};

function createRepoFromSpaceMembership(membership) {
  const spaceId = membership.sys.space.sys.id;
  const endpoint = createSpaceEndpoint(spaceId);
  return createSpaceMembershipRepo(endpoint);
}

function getAllUserSpaceMemberships(userId, orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  const includePaths = ['roles', 'sys.space', 'sys.createdBy'];
  return fetchAndResolve(
    getAllSpaceMemberships(endpoint, {
      'sys.user.sys.id': userId,
      include: includePaths.join(),
    }),
    includePaths
  );
}

function getAllUserTeamMemberships(membershipId, orgId, hasTeamsFeature) {
  const endpoint = createOrganizationEndpoint(orgId);
  const includePaths = ['sys.team'];

  if (hasTeamsFeature) {
    return fetchAndResolve(
      getAllTeamMemberships(endpoint, {
        include: includePaths,
        'sys.organizationMembership.sys.id': membershipId,
      }),
      includePaths
    );
  }
  return Promise.resolve([]);
}
