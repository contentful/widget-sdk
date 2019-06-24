import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import {
  Button,
  Tooltip,
  Tabs,
  Tab,
  TabPanel,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams, getCurrentTeam, hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { getTeamSpaceMembershipsOfCurrentTeamToDisplay } from 'redux/selectors/teamSpaceMemberships.es6';
import { getMembershipsOfCurrentTeamToDisplay } from 'redux/selectors/teamMemberships.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import Workbench from 'app/common/Workbench.es6';
import Placeholder from 'app/common/Placeholder.es6';
import Icon from 'ui/Components/Icon.es6';
import ellipsisStyle from 'ellipsisStyle.es6';
import TeamsEmptyStateImage from 'svg/add-user-illustration.es6';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import ROUTES from 'redux/routes.es6';

import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';
import TeamMemberships from './TeamMemberships/TeamMemberships.es6';
import TeamSpaceMemberships from './TeamSpaceMemberships/TeamSpaceMemberships.es6';
import TeamDialog from './TeamDialog.es6';

const AddButton = ({ label, onClick, disabled, className }) => (
  <Button
    testId="add-button"
    buttonType="primary"
    onClick={onClick}
    disabled={disabled}
    className={className}>
    {label}
  </Button>
);
AddButton.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
AddButton.defaultProps = {
  onClick: () => {},
  disabled: false
};

const EditButton = ({ onClick }) => (
  <Button
    testId="edit-team-button"
    size="small"
    buttonType="muted"
    disabled={!onClick}
    onClick={onClick}>
    Edit team details
  </Button>
);
EditButton.propTypes = { onClick: PropTypes.func };

const DeleteButton = ({ onClick }) => (
  <Button
    testId="delete-team-button"
    size="small"
    buttonType="negative"
    disabled={!onClick}
    onClick={onClick}>
    Delete team
  </Button>
);
DeleteButton.propTypes = { onClick: PropTypes.func };

const styles = {
  tabs: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacingL
  }),
  details: css({
    padding: '1em 2em 2em',
    display: 'flex'
  }),
  detailsContent: css({
    flex: 1
  }),
  sidebar: css({
    marginRight: '25px',
    width: '400px'
  }),
  profileSection: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: '20px',
    marginBottom: '20px'
  }),
  card: css({
    '> *': {
      marginBottom: '1rem'
    }
  }),
  name: css(ellipsisStyle),
  description: css(ellipsisStyle),
  svgContainer: css({ width: '15vw', minWidth: '280px', marginLeft: '-1vw' })
};

class TeamDetails extends React.Component {
  static propTypes = {
    spaceMembershipsEnabled: PropTypes.bool.isRequired,

    emptyTeamMemberships: PropTypes.bool.isRequired,
    emptyTeamSpaceMemberships: PropTypes.bool.isRequired,
    readOnlyPermission: PropTypes.bool.isRequired,
    team: TeamPropType,
    orgId: PropTypes.string.isRequired,
    removeTeam: PropTypes.func.isRequired
  };

  tabs = {
    teamMembers: {
      label: 'Team members',
      component: TeamMemberships,
      actionLabel: 'Add a team member',
      emptyStateMessage: () => ({
        title: 'Better together',
        text: (
          <>
            Add the first team member to{' '}
            <span className="f36-font-weight--demi-bold">{this.props.team.name}</span>
          </>
        ),
        readOnly: (
          <>
            To add a team member to{' '}
            <span className="f36-font-weight--demi-bold">{this.props.team.name}</span>, contact your
            admin
          </>
        )
      })
    },
    spaceMemberships: {
      label: 'Space memberships',
      component: TeamSpaceMemberships,
      actionLabel: 'Add to space',
      emptyStateMessage: () => ({
        title: `Where will this team work`,
        text: 'Give every team member access to one or more spaces',
        readOnly: (
          <>
            To grant <span className="f36-font-weight--demi-bold">{this.props.team.name}</span>{' '}
            access to more or one spaces, contact your admin
          </>
        )
      })
    }
  };

  state = {
    showTeamDialog: false,
    selectedTab: this.tabs.teamMembers,
    showingForm: false
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

  render() {
    const { team, removeTeam, readOnlyPermission, orgId } = this.props;
    const { showTeamDialog, showingForm } = this.state;
    const creator = team && team.sys.createdBy;
    const pathBack = ROUTES.organization.children.teams.build({ orgId });

    return (
      <Workbench testId="organization-team-page">
        <Workbench.Header>
          <div className="breadcrumbs-widget">
            <div className="breadcrumbs-container">
              <a data-test-id="link-to-list" href={pathBack}>
                <div data-test-id="teams-back" className="btn btn__back">
                  <Icon name="back" />
                </div>
              </a>
            </div>
          </div>
          <Workbench.Title>Teams</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <ExperimentalFeatureNote />
          {team && (
            <div className={styles.details} data-test-id="team-details">
              <div className={styles.sidebar}>
                <section className={styles.profileSection}>
                  <div className={styles.card}>
                    <h2 className={styles.name} data-test-id="team-card-name" title={team.name}>
                      {team.name}
                    </h2>
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
                <section className={styles.profileSection}>
                  <dl className="definition-list">
                    <dt>Created at</dt>
                    <dd data-test-id="creation-date">
                      {moment(team.sys.createdAt).format('MMMM DD, YYYY')}
                    </dd>
                    {!readOnlyPermission && (
                      <React.Fragment>
                        <dt>Created by</dt>
                        <dd data-test-id="creator-name">{getUserName(creator)}</dd>
                      </React.Fragment>
                    )}
                  </dl>
                </section>
                {readOnlyPermission ? (
                  <Tooltip
                    testId="read-only-tooltip"
                    place="right"
                    content="You don't have permission to delete a team">
                    <DeleteButton />
                  </Tooltip>
                ) : (
                  <DeleteButton onClick={() => removeTeam(team.sys.id)} />
                )}
              </div>
              <div className={styles.detailsContent}>
                <header className={styles.tabs}>
                  {this.props.spaceMembershipsEnabled && (
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
                  )}
                  {!this.props.spaceMembershipsEnabled && (
                    <Heading element="h2">Team members</Heading>
                  )}
                  {!showingForm &&
                    !this.isListEmpty() &&
                    (readOnlyPermission ? (
                      <Tooltip
                        testId="read-only-tooltip"
                        place="left"
                        content="You don't have permission to change this team">
                        <AddButton disabled label={this.state.selectedTab.actionLabel} />
                      </Tooltip>
                    ) : (
                      <AddButton
                        onClick={() => this.setState({ showingForm: true })}
                        label={this.state.selectedTab.actionLabel}
                      />
                    ))}
                </header>

                {Object.entries(this.tabs).map(
                  ([id, { component: Component, emptyStateMessage, actionLabel }]) => (
                    <React.Fragment key={id}>
                      {this.isSelected(id) && !this.isListEmpty() ? (
                        <TabPanel id={id}>
                          <Component
                            showingForm={this.state.showingForm}
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
                              <AddButton
                                className="f36-margin-top--l"
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
              button={<Button href={pathBack}>Go to team list</Button>}
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

export default connect(
  state => ({
    team: getTeams(state)[getCurrentTeam(state)],
    orgId: getOrgId(state),
    readOnlyPermission: hasReadOnlyPermission(state),
    emptyTeamMemberships: getMembershipsOfCurrentTeamToDisplay(state).length === 0,
    emptyTeamSpaceMemberships: getTeamSpaceMembershipsOfCurrentTeamToDisplay(state).length === 0
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(TeamDetails);
