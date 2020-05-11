import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import Placeholder from 'app/common/Placeholder';
import {
  Button,
  Tooltip,
  Tabs,
  Tab,
  TabPanel,
  Heading,
  Paragraph,
  Subheading,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import TeamsEmptyStateImage from 'svg/illustrations/add-user-illustration.svg';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import * as Navigator from 'states/Navigator';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { TeamDialog } from './TeamDialog';
import { TeamDetailsAddButton } from './TeamDetailsAddButton';
import { TeamMembershipList } from './TeamMembershipList';
import { TeamSpaceMembershipList } from './TeamSpaceMembershipList';
import { getTeam, removeTeam } from '../services/TeamRepo';
import { DeleteButton } from './TeamDetailsDeleteButton';
import { EditButton } from './TeamDetailsEditButton';

const ellipsisStyle = {
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '1.2em',
};

const styles = {
  tabs: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacingL,
  }),
  details: css({
    padding: '1em 2em 2em',
    display: 'flex',
  }),
  detailsContent: css({
    flex: 1,
  }),
  sidebar: css({
    marginRight: '25px',
    width: '400px',
  }),
  profileSection: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: '20px',
    marginBottom: '20px',
  }),
  card: css({
    '> *': {
      marginBottom: '1rem',
    },
  }),
  name: css(ellipsisStyle),
  description: css(ellipsisStyle),
  svgContainer: css({ width: '15vw', minWidth: '280px', marginLeft: '-1vw' }),
  emptyMessageTeamName: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  addButton: css({
    marginTop: tokens.spacingL,
  }),
};

export class TeamDetails extends React.Component {
  static propTypes = {
    teamId: PropTypes.string.isRequired,
    orgId: PropTypes.string.isRequired,
    emptyTeamMemberships: PropTypes.bool,
    emptyTeamSpaceMemberships: PropTypes.bool,
    noOrgMembersLeft: PropTypes.bool,
  };

  isSelected(id) {
    return this.state.selectedTab === this.tabs[id];
  }

  selectTab(id) {
    this.setState({ selectedTab: this.tabs[id], showingForm: false });
  }

  isListEmpty() {
    const { selectedTab, showingForm } = this.state;
    const { emptyTeamMemberships, emptyTeamSpaceMemberships } = this.props;
    return (
      !showingForm &&
      ((selectedTab === this.tabs.teamMembers && emptyTeamMemberships) ||
        (selectedTab === this.tabs.spaceMemberships && emptyTeamSpaceMemberships))
    );
  }

  tabs = {
    teamMembers: {
      label: 'Team members',
      component: TeamMembershipList,
      actionLabel: 'Add a team member',
      emptyStateMessage: () => ({
        title: 'Better together',
        text: (
          <>
            Add the first team member to{' '}
            <span className={styles.emptyMessageTeamName}>{this.state.team.name}</span>
          </>
        ),
        readOnly: (
          <>
            To add a team member to{' '}
            <span className={styles.emptyMessageTeamName}>{this.state.team.name}</span>, contact
            your admin
          </>
        ),
      }),
    },
    spaceMemberships: {
      label: 'Space memberships',
      component: TeamSpaceMembershipList,
      actionLabel: 'Add to space',
      emptyStateMessage: () => ({
        title: `Where will this team work`,
        text: 'Give every team member access to one or more spaces',
        readOnly: (
          <>
            To grant <span className={styles.emptyMessageTeamName}>{this.state.team.name}</span>{' '}
            access to more or one spaces, contact your admin
          </>
        ),
      }),
    },
  };

  state = {
    team: null,
    readOnlyPermission: false,
    showTeamDialog: false,
    selectedTab: this.tabs.teamMembers,
    showingForm: false,
  };

  getAddButton() {
    const { noOrgMembersLeft } = this.props;
    const { selectedTab, readOnlyPermission } = this.state;

    if (readOnlyPermission) {
      return (
        <Tooltip
          testId="read-only-tooltip"
          place="left"
          content="You don't have permission to change this team">
          <TeamDetailsAddButton disabled label={selectedTab.actionLabel} />
        </Tooltip>
      );
    }

    if (selectedTab === this.tabs.teamMembers && noOrgMembersLeft) {
      return (
        <Tooltip
          testId="no-members-left-tooltip"
          place="left"
          content="All organization members are already in this team">
          <TeamDetailsAddButton disabled label={this.state.selectedTab.actionLabel} />
        </Tooltip>
      );
    }

    return (
      <TeamDetailsAddButton
        onClick={() => this.setState({ showingForm: true })}
        label={this.state.selectedTab.actionLabel}
      />
    );
  }

  async componentDidMount() {
    const endpoint = createOrganizationEndpoint(this.props.orgId);
    const [team, organization] = await Promise.all([
      getTeam(endpoint, this.props.teamId),
      getOrganization(this.props.orgId),
    ]);

    const readOnlyPermission = isOwnerOrAdmin(organization);
    this.setState({ team, readOnlyPermission });
  }

  async deleteTeam() {
    const endpoint = createOrganizationEndpoint(this.props.orgId);
    await removeTeam(endpoint, this.props.teamId);
    this.setState({ showingTeamDialog: true });
  }

  render() {
    const { team, showTeamDialog, showingForm, readOnlyPermission } = this.state;
    const path = ['organization', 'teams'];

    return (
      <Workbench testId="organization-team-page">
        <Workbench.Header
          testId="link-to-list"
          onBack={() => {
            Navigator.go({ path });
          }}
          title="Teams"
        />
        <Workbench.Content>
          {team && (
            <div className={styles.details} data-test-id="team-details">
              <div className={styles.sidebar}>
                <section className={styles.profileSection}>
                  <div className={styles.card}>
                    <Subheading className={styles.name} testId="team-card-name" title={team.name}>
                      {team.name}
                    </Subheading>
                    {team.description && (
                      <div
                        className={styles.description}
                        data-test-id="team-card-description"
                        title={team.description}>
                        {team.description.split('\n').reduce((acc, cur, idx) => {
                          if (idx === 0) {
                            return [...acc, cur];
                          }
                          return [...acc, <br key={idx} />, cur];
                        }, [])}
                      </div>
                    )}
                    {readOnlyPermission ? (
                      <Tooltip
                        testId="read-only-tooltip"
                        place="right"
                        content="You don't have permission to edit team details">
                        <EditButton />
                      </Tooltip>
                    ) : (
                      <EditButton onClick={() => this.setState({ showTeamDialog: true })} />
                    )}
                  </div>
                </section>
                {team.sys && (
                  <section className={styles.profileSection}>
                    <dl className="definition-list">
                      <dt>Created at</dt>
                      <dd data-test-id="creation-date">
                        {moment(team.sys.createdAt).format('MMMM DD, YYYY')}
                      </dd>
                      {!readOnlyPermission && (
                        <React.Fragment>
                          <dt>Created by</dt>
                          <dd data-test-id="creator-name">{getUserName(team.sys.createdBy)}</dd>
                        </React.Fragment>
                      )}
                    </dl>
                  </section>
                )}
                {readOnlyPermission ? (
                  <Tooltip
                    testId="read-only-tooltip"
                    place="right"
                    content="You don't have permission to delete a team">
                    <DeleteButton />
                  </Tooltip>
                ) : (
                  <DeleteButton onClick={() => this.deleteTeam()} />
                )}
              </div>
              <div className={styles.detailsContent}>
                <header className={styles.tabs}>
                  <Tabs role="tablist">
                    {Object.entries(this.tabs).map(([id, { label }]) => (
                      <Tab
                        key={id}
                        id={id}
                        testId={`tab-${id}`}
                        selected={this.isSelected(id)}
                        onSelect={() => this.selectTab(id)}>
                        {label}
                      </Tab>
                    ))}
                  </Tabs>
                  {!showingForm && !this.isListEmpty() && this.getAddButton()}
                </header>

                {Object.entries(this.tabs).map(
                  ([id, { component: Component, emptyStateMessage, actionLabel }]) => (
                    <React.Fragment key={id}>
                      {this.isSelected(id) && !this.isListEmpty() ? (
                        <TabPanel id={id}>
                          <Component
                            showingForm={showingForm}
                            onFormDismissed={() => this.setState({ showingForm: false })}
                          />
                        </TabPanel>
                      ) : null}
                      {this.isSelected(id) && this.isListEmpty() && (
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
                                onClick={() => this.setState({ showingForm: true })}
                                label={actionLabel}
                              />
                            </>
                          )}
                          {readOnlyPermission && (
                            <Paragraph>{emptyStateMessage().readOnly}</Paragraph>
                          )}
                        </EmptyStateContainer>
                      )}
                    </React.Fragment>
                  )
                )}
              </div>
            </div>
          )}
          {!team && (
            <Placeholder
              testId="not-found-placeholder"
              title="The team you were looking for was not found 🔎"
              text="It might have been deleted or you lost permission to see it"
              button={
                <Button
                  href={() => {
                    Navigator.go({ path });
                  }}>
                  Go to team list
                </Button>
              }
            />
          )}
          <TeamDialog
            testId="edit-team-dialog"
            onClose={() => this.setState({ showTeamDialog: false })}
            isShown={showTeamDialog}
            initialTeam={team}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}
