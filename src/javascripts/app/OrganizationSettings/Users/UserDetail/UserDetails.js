import React, { useReducer, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { Tabs, Tab, Button, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { createImmerReducer } from 'redux/utils/createImmerReducer';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';
import { useAsyncFn } from 'app/common/hooks/useAsync';
import { fetchAndResolve } from 'data/LinkResolver';
import { getSpaceMemberships } from 'access_control/OrganizationMembershipRepository';
import { getAllTeamMemberships } from 'access_control/TeamRepository';
import { go } from 'states/Navigator';
import UserCard from '../UserCard';
import Icon from 'ui/Components/Icon';
import UserSpaceList from './UserSpaceList';
import UserTeamList from './UserTeamList';
import UserAttributes from './UserAttributes';
import ModalLauncher from 'app/common/ModalLauncher';
import AddToSpacesModal from 'app/OrganizationSettings/Users/common/AddToSpacesModal';
import EditSpaceMembershipModal from './EditSpaceMembershipModal';

const styles = {
  tabs: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacingL
  })
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
      membership => membership.sys.space.sys.id !== action.payload.sys.space.sys.id
    );
  },
  SPACE_MEMBERSHIP_UPDATED: (state, action) => {
    const membershipId = action.payload.sys.id;
    const index = state.spaceMemberships.findIndex(
      membership => membership.sys.id === membershipId
    );
    state.spaceMemberships.splice(index, 1, action.payload);
  },
  TEAM_MEMBERSHIPS_FETCHED: (state, action) => {
    state.teamMemberships = action.payload;
  },
  ORG_ROLE_CHANGED: (state, action) => {
    state.membership.role = action.payload.role;
    state.membership.sys.version = action.payload.sys.version;
  }
});

const tabs = {
  SPACES: {
    label: 'Spaces',
    buttonLabel: 'Add to space'
  },
  TEAMS: {
    label: 'Teams',
    buttonLabel: 'Add to team'
  }
};

export default function UserDetails({ initialMembership, isSelf, orgId, hasTeamsFeature }) {
  const userId = initialMembership.sys.user.sys.id;

  const [{ membership, selectedTab, spaceMemberships, teamMemberships }, dispatch] = useReducer(
    reducer,
    {
      membership: initialMembership,
      spaceMemberships: [],
      teamMemberships: [],
      selectedTab: tabs.SPACES
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

  const currentSpaces = useMemo(() => spaceMemberships.map(sm => sm.sys.space), [spaceMemberships]);

  useEffect(() => {
    updateSpaceMemberships();
    updateTeamMemberships();
  }, [updateSpaceMemberships, updateTeamMemberships]);

  const removeSpaceMembership = spaceMembership => {
    const repo = createRepoFromSpaceMembership(spaceMembership);
    repo.remove(spaceMembership);
    dispatch({ type: 'SPACE_MEMBERSHIP_REMOVED', payload: spaceMembership });
  };

  const handleSpaceRoleChanged = useCallback(
    updatedMembership => dispatch({ type: 'SPACE_MEMBERSHIP_UPDATED', payload: updatedMembership }),
    []
  );

  const editSpaceMembership = spaceMembership => {
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

  const handleBackButtonClicked = () => {
    go({
      path: ['account', 'organizations', 'users', 'list']
    });
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Users"
        icon={<Icon name="page-users" scale="0.75" />}
        onBack={handleBackButtonClicked}
      />
      <Workbench.Content>
        <UserCard user={membership.sys.user} size="large" status={membership.status} />
        <UserAttributes
          membership={membership}
          isSelf={isSelf}
          orgId={orgId}
          onRoleChange={membership => dispatch({ type: 'ORG_ROLE_CHANGED', payload: membership })}
        />
        <div className={styles.tabs}>
          {hasTeamsFeature && (
            <Tabs>
              {Object.values(tabs).map(tab => (
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
            <Button onClick={handleAddToSpace}>{selectedTab.buttonLabel}</Button>
          )}
        </div>

        {selectedTab === tabs.SPACES && (
          <UserSpaceList
            user={membership.sys.user}
            memberships={spaceMemberships}
            loading={isLoadingSpaceMemberships}
            onSpaceMembershipRemove={removeSpaceMembership}
            onSpaceMembershipEdit={editSpaceMembership}
          />
        )}
        {selectedTab === tabs.TEAMS && (
          <UserTeamList
            user={membership.sys.user}
            memberships={teamMemberships}
            loading={isLoadingTeamMemberships}
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
  hasTeamsFeature: PropTypes.bool.isRequired
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
    getSpaceMemberships(endpoint, {
      'sys.user.sys.id': userId,
      include: includePaths.join()
    }),
    includePaths
  );
}

function getAllUserTeamMemberships(membershipId, orgId, hasTeamsFeature) {
  const endpoint = createOrganizationEndpoint(orgId);
  const includePaths = ['sys.team'];

  if (hasTeamsFeature)
    return fetchAndResolve(
      getAllTeamMemberships(endpoint, {
        include: includePaths,
        'sys.organizationMembership.id': membershipId
      }),
      includePaths
    );

  return Promise.resolve([]);
}
