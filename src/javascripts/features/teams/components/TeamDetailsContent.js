import React, { useEffect, useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Tabs,
  Tab,
  TabPanel,
  Heading,
  Paragraph,
  Notification,
  ModalConfirm,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { useAsyncFn } from 'core/hooks';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import TeamsEmptyStateImage from 'svg/illustrations/add-user-illustration.svg';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import {
  getAllTeamMemberships,
  getAllTeamSpaceMemberships,
  removeTeamMembership,
  deleteTeamSpaceMembership,
} from '../services/TeamRepository';
import { TeamDetailsAddButton } from './TeamDetailsAddButton';
import { TeamMembershipList } from './TeamMembershipList';
import { AddToTeamModal } from './AddToTeamModal';
import { TeamSpaceMembershipList } from './TeamSpaceMembershipList';
import { AddToSpacesModal } from './AddToSpacesModal';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { ModalLauncher } from 'core/components/ModalLauncher';

const styles = {
  tabs: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacingL,
  }),
  svgContainer: css({ width: '15vw', minWidth: '280px', marginLeft: '-1vw' }),
  emptyMessageTeamName: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  addButton: css({
    marginTop: tokens.spacingL,
  }),
};

const userToString = ({ firstName, lastName, email }) =>
  firstName ? `${firstName} ${lastName}` : email;

const reducer = createImmerReducer({
  TAB_SELECTED: (state, action) => {
    state.selectedTab = action.payload;
  },
  TEAM_MEMBERSHIPS_FETCHED: (state, action) => {
    state.teamMembers = action.payload;
  },
  TEAM_MEMBERSHIPS_REMOVED: (state, action) => {
    state.teamMembers = state.teamMembers.filter(
      (membership) => membership.sys.id !== action.payload.sys.id
    );
  },
  SPACE_MEMBERSHIPS_FETCHED: (state, action) => {
    state.spaceMemberships = action.payload;
  },
  SPACE_MEMBERSHIP_REMOVED: (state, action) => {
    state.spaceMemberships = state.spaceMemberships.filter(
      (membership) => membership.sys.space.sys.id !== action.payload.sys.space.sys.id
    );
  },
});

export function TeamDetailsContent({ team, orgId, readOnlyPermission }) {
  const tabs = {
    teamMembers: {
      id: 'teamMembers',
      label: 'Team members',
      component: TeamMembershipList,
      actionLabel: 'Add a team member',
      emptyStateMessage: () => ({
        title: 'Better together',
        text: (
          <>
            Add the first team member to{' '}
            <span className={styles.emptyMessageTeamName}>{team.name}</span>
          </>
        ),
        readOnly: (
          <>
            To add a team member to <span className={styles.emptyMessageTeamName}>{team.name}</span>
            , contact your admin
          </>
        ),
      }),
    },
    spaceMemberships: {
      id: 'spaceMemberships',
      label: 'Space memberships',
      component: TeamSpaceMembershipList,
      actionLabel: 'Add to space',
      emptyStateMessage: () => ({
        title: `Where will this team work`,
        text: 'Give every team member access to one or more spaces',
        readOnly: (
          <>
            To grant <span className={styles.emptyMessageTeamName}>{team.name}</span> access to more
            or one spaces, contact your admin
          </>
        ),
      }),
    },
  };

  const [{ teamMembers, spaceMemberships, selectedTab }, dispatch] = useReducer(reducer, {
    teamMembers: [],
    spaceMemberships: [],
    selectedTab: tabs.teamMembers,
  });

  const orgEndpoint = createOrganizationEndpoint(orgId);
  const teamId = team.sys.id;

  //fetch TeamMemberships data
  const fetchTeamMembersData = (orgEndpoint, teamId) => async () => {
    const teamMembers = await getAllTeamMemberships(orgEndpoint, teamId);
    dispatch({ type: 'TEAM_MEMBERSHIPS_FETCHED', payload: teamMembers });
    return teamMembers;
  };

  const boundFetchTeamMembers = fetchTeamMembersData(orgEndpoint, teamId);
  const [{ isLoading: isLoadingTeamMembers }, updateTeamMembers] = useAsyncFn(
    useCallback(boundFetchTeamMembers, [])
  );

  //fetch TeamSpaceMemberships data
  const fetchSpaceMembershipsData = (orgEndpoint, teamId) => async () => {
    const data = await getAllTeamSpaceMemberships(orgEndpoint);
    const spaceMemberships = data.filter((item) => {
      return item.sys.team.sys.id === teamId;
    });
    dispatch({ type: 'SPACE_MEMBERSHIPS_FETCHED', payload: spaceMemberships });
    return spaceMemberships;
  };

  const boundFetchSpaceMemberships = fetchSpaceMembershipsData(orgEndpoint, teamId);
  const [{ isLoading: isLoadingSpaceMemberships }, updateSpaceMemberships] = useAsyncFn(
    useCallback(boundFetchSpaceMemberships, [])
  );

  useEffect(() => {
    updateSpaceMemberships();
    updateTeamMembers();
  }, [updateSpaceMemberships, updateTeamMembers]);

  // Add team member
  const handleAddToTeamClick = () => {
    const currentTeamMembers = teamMembers.map((tm) => tm.sys.organizationMembership.sys.id);
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <AddToTeamModal
          team={team}
          orgId={orgId}
          isShown={isShown}
          onClose={onClose}
          currentTeamMembers={currentTeamMembers}
          onAddedToTeam={updateTeamMembers}
        />
      );
    });
  };

  // Add team to space
  const handleAddToSpaceClick = () => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <AddToSpacesModal
          team={team}
          orgId={orgId}
          currentSpaces={spaceMemberships.map((membership) => membership.sys.space)}
          isShown={isShown}
          onClose={onClose}
          onAddedToSpaces={updateSpaceMemberships}
        />
      );
    });
  };

  // Delete team membership
  const removeFromTeam = async (teamMembership) => {
    const user = teamMembership.sys.user;

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        title={`Remove user from team ${team.name}`}
        intent="negative"
        isShown={isShown}
        confirmLabel="Remove"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <Paragraph>{`Are you sure you want to remove ${userToString(user)} from team ${
          team.name
        }?`}</Paragraph>
      </ModalConfirm>
    ));

    if (!confirmation) {
      return;
    }

    try {
      await removeTeamMembership(
        orgEndpoint,
        teamMembership.sys.team.sys.id,
        teamMembership.sys.id
      );
      dispatch({ type: 'TEAM_MEMBERSHIPS_REMOVED', payload: teamMembership });
      Notification.success(`Successfully removed ${userToString(user)} from the team ${team.name}`);
    } catch (e) {
      Notification.error(`Could not remove ${userToString(user)} from team ${team.name}`);
    }
  };

  // Delete team space membership
  const removeTeamSpaceMembership = async (teamSpaceMembership) => {
    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        title={`Remove team ${team.name} from space ${teamSpaceMembership.sys.space.name}`}
        intent="negative"
        isShown={isShown}
        confirmLabel="Remove"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <Paragraph>{`Are you sure you want to remove team ${team.name} from the space  ${teamSpaceMembership.sys.space.name}?`}</Paragraph>
      </ModalConfirm>
    ));

    if (!confirmation) {
      return;
    }

    try {
      const spaceEndpoint = createSpaceEndpoint(teamSpaceMembership.sys.space.sys.id);
      await deleteTeamSpaceMembership(spaceEndpoint, teamSpaceMembership);
      dispatch({
        type: 'SPACE_MEMBERSHIP_REMOVED',
        payload: teamSpaceMembership,
      });
      Notification.success(
        `Successfully removed team ${team.name} from space ${teamSpaceMembership.sys.space.name}`
      );
    } catch (e) {
      Notification.error(`Could not remove team from space ${teamSpaceMembership.sys.space.name}`);
    }
  };

  if (isLoadingTeamMembers || isLoadingSpaceMemberships) {
    return <Skeleton />;
  }

  const selectTab = (id) => {
    dispatch({ type: 'TAB_SELECTED', payload: tabs[id] });
  };

  const isSelected = (id) => {
    return selectedTab.id === id;
  };

  const isListEmpty = () => {
    return (
      (isSelected('teamMembers') && teamMembers.length === 0) ||
      (isSelected('spaceMemberships') && spaceMemberships.length === 0)
    );
  };

  return (
    <div className={styles.detailsContent}>
      <header className={styles.tabs}>
        <Tabs role="tablist">
          {Object.entries(tabs).map(([id, { label }]) => (
            <Tab
              key={id}
              id={id}
              testId={`tab-${id}`}
              selected={isSelected(id)}
              onSelect={() => selectTab(id)}>
              {label}
            </Tab>
          ))}
        </Tabs>
        {!isListEmpty() && (
          <TeamDetailsAddButton
            label={selectedTab.actionLabel}
            onClick={isSelected('teamMembers') ? handleAddToTeamClick : handleAddToSpaceClick}
            readOnlyPermission={readOnlyPermission}
          />
        )}
      </header>

      {Object.entries(tabs).map(([id, { emptyStateMessage, actionLabel }]) => {
        return (
          <React.Fragment key={id}>
            {isSelected(id) && !isListEmpty() ? (
              <TabPanel id={id}>
                {selectedTab.id === 'teamMembers' && (
                  <TeamMembershipList
                    team={team}
                    items={teamMembers}
                    removeFromTeam={removeFromTeam}
                    readOnlyPermission={readOnlyPermission}
                  />
                )}
                {selectedTab.id === 'spaceMemberships' && (
                  <TeamSpaceMembershipList
                    orgId={orgId}
                    items={spaceMemberships}
                    onEdit={updateSpaceMemberships}
                    removeTeamSpaceMembership={removeTeamSpaceMembership}
                    readOnlyPermission={readOnlyPermission}
                  />
                )}
              </TabPanel>
            ) : null}
            {isSelected(id) && isListEmpty() && (
              <EmptyStateContainer data-test-id="empty-placeholder">
                <div className={styles.svgContainer}>
                  <TeamsEmptyStateImage />
                </div>
                <Heading>{emptyStateMessage().title}</Heading>
                {!readOnlyPermission && (
                  <>
                    <Paragraph>{emptyStateMessage().text}</Paragraph>
                    <TeamDetailsAddButton
                      className={styles.addButton}
                      label={actionLabel}
                      onClick={
                        isSelected('teamMembers') ? handleAddToTeamClick : handleAddToSpaceClick
                      }
                      readOnlyPermission={readOnlyPermission}
                    />
                  </>
                )}
                {readOnlyPermission && <Paragraph>{emptyStateMessage().readOnly}</Paragraph>}
              </EmptyStateContainer>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

TeamDetailsContent.propTypes = {
  team: TeamPropType.isRequired,
  orgId: PropTypes.string.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
};

function Skeleton() {
  return (
    <SkeletonContainer data-test-id="content-loader" ariaLabel="Loading the list " svgWidth="100%">
      <SkeletonBodyText numberOfLines={2} />
      <SkeletonBodyText numberOfLines={2} offsetTop={75} />
      <SkeletonBodyText numberOfLines={2} offsetTop={150} />
      <SkeletonBodyText numberOfLines={2} offsetTop={225} />
      <SkeletonBodyText numberOfLines={2} offsetTop={300} />
      <SkeletonBodyText numberOfLines={2} offsetTop={375} />
    </SkeletonContainer>
  );
}
