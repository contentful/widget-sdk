import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { Tabs, Tab, TabPanel, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { useAsync } from 'core/hooks';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import { getAllMemberships } from 'access_control/OrganizationMembershipRepository';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import TeamsEmptyStateImage from 'svg/illustrations/add-user-illustration.svg';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { getTeamMemberships, getTeamSpaceMemberships } from '../services/TeamRepo';
import { TeamDetailsAddButton } from './TeamDetailsAddButton';
import { TeamMembershipList } from './TeamMembershipList';
import { TeamSpaceMembershipList } from './TeamSpaceMembershipList';

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

const fetchData = (teamId, orgId, setData) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);
  const [teamMemberships, teamSpaceMemberships, orgMemberships] = await Promise.all([
    getTeamMemberships(endpoint, teamId),
    getTeamSpaceMemberships(endpoint),
    getAllMemberships(endpoint),
  ]);

  const spaceMemberships = teamSpaceMemberships.items.filter((item) => {
    return item.sys.team.sys.id === teamId;
  });
  const unavailableOrgMemberships = teamMemberships.items.map((item) =>
    get(item, 'sys.organizationMembership.sys.id')
  );
  const availableOrgMemberships = orgMemberships
    ? Object.values(orgMemberships).filter(
        ({ sys: { id } }) => !unavailableOrgMemberships.includes(id)
      )
    : [];
  setData({ teamMembers: teamMemberships.items, spaceMemberships, availableOrgMemberships });
};

TeamDetailsContent.propTypes = {
  team: TeamPropType.isRequired,
  orgId: PropTypes.string.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
};

export function TeamDetailsContent({ team, orgId, readOnlyPermission }) {
  const [data, setData] = useState({
    teamMembers: [],
    spaceMemberships: [],
    availableOrgMemberships: [],
  });

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

  const boundFetch = fetchData(team.sys.id, orgId, setData);

  const { isLoading, error } = useAsync(useCallback(boundFetch, []));

  const [selectedTab, setSelectedTab] = useState(tabs.teamMembers);
  const [showingForm, setShowingForm] = useState(false);

  const isSelected = (id) => {
    return selectedTab.id === id;
  };

  const selectTab = (id) => {
    setSelectedTab(tabs[id]);
    setShowingForm(false);
  };

  const isListEmpty = () => {
    return (
      !showingForm &&
      ((selectedTab === tabs.teamMembers && data.teamMembers.length === 0) ||
        (selectedTab === tabs.spaceMemberships && data.spaceMemberships.length === 0))
    );
  };

  if (isLoading || !data) {
    return <FetcherLoading message="Loading data" />;
  }

  if (error) {
    console.log(error);
    return <ForbiddenPage />;
  }

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
        {!showingForm && !isListEmpty() && (
          <TeamDetailsAddButton
            label={selectedTab.actionLabel}
            onClick={() => setShowingForm(true)}
            readOnlyPermission={readOnlyPermission}
            noOrgMembershipsLeft={
              selectedTab === tabs.teamMembers && data.availableOrgMemberships.length === 0
            }
          />
        )}
      </header>

      {Object.entries(tabs).map(
        ([id, { component: Component, emptyStateMessage, actionLabel }]) => {
          return (
            <React.Fragment key={id}>
              {isSelected(id) && !isListEmpty() ? (
                <TabPanel id={id}>
                  <Component
                    items={data[id]}
                    showingForm={showingForm}
                    onFormDismissed={() => setShowingForm(false)}
                  />
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
                        onClick={() => setShowingForm(true)}
                        label={actionLabel}
                        readOnlyPermission={readOnlyPermission}
                      />
                    </>
                  )}
                  {readOnlyPermission && <Paragraph>{emptyStateMessage().readOnly}</Paragraph>}
                </EmptyStateContainer>
              )}
            </React.Fragment>
          );
        }
      )}
    </div>
  );
}
