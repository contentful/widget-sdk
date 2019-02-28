import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { Button, Tooltip, Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams, getCurrentTeam, hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { getCurrentTeamSpaceMembershipList } from 'redux/selectors/teamSpaceMemberships.es6';
import { getCurrentTeamMembershipList } from 'redux/selectors/teamMemberships.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import Workbench from 'app/common/Workbench.es6';
import Placeholder from 'app/common/Placeholder.es6';
import Icon from 'ui/Components/Icon.es6';
import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';

import TeamMemberships from './TeamMemberships/TeamMemberships.es6';
import TeamSpaceMemberships from './TeamSpaceMemberships/TeamSpaceMemberships.es6';
import TeamDialog from './TeamDialog.es6';
import ROUTES from 'redux/routes.es6';

const AddButton = ({ label, onClick, disabled }) => (
  <Button
    testId="add-button"
    size="small"
    buttonType="primary"
    onClick={onClick}
    disabled={disabled}>
    {label}
  </Button>
);
AddButton.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool
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
  })
};

class TeamDetails extends React.Component {
  static propTypes = {
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
        title: `Team ${this.props.team.name} has no members 🐚`,
        text: 'They’re not gonna magically appear.',
        readOnly: `You don't have permission to add new members`
      })
    },
    spaceMemberships: {
      label: 'Space memberships',
      component: TeamSpaceMemberships,
      actionLabel: 'Add to space',
      emptyStateMessage: () => ({
        title: `Team ${this.props.team.name} is not in any space yet 🐚`,
        text: 'Give every team member access to spaces by creating team space memberships',
        readOnly: `You don't have permission to add the team to a space`
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
      <Workbench className="organization-users-page" testId="organization-team-page">
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
            <div className="user-details" data-test-id="team-details">
              <div className="user-details__sidebar">
                <section className="user-details__profile-section">
                  <div className="team-card">
                    <h2 className="team-card__name" data-test-id="team-card-name">
                      {team.name}
                    </h2>
                    {team.description && (
                      <div className="team-card_description" data-test-id="team-card-description">
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
                <section className="user-details__profile-section">
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
              <div className="user-details__content">
                <header className={styles.tabs}>
                  <Tabs role="tablist">
                    {Object.entries(this.tabs).map(([id, { label }]) => (
                      <Tab
                        key={id}
                        id={id}
                        selected={this.isSelected(id)}
                        onSelect={() => this.selectTab(id)}>
                        {label}
                      </Tab>
                    ))}
                  </Tabs>
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
                      {this.isSelected(id) && this.isListEmpty() && !readOnlyPermission && (
                        <Placeholder
                          testId="no-members-placeholder"
                          title={emptyStateMessage().title}
                          text={emptyStateMessage().text}
                          button={
                            <AddButton
                              onClick={() => this.setState({ showingForm: true })}
                              label={actionLabel}
                            />
                          }
                        />
                      )}
                      {this.isSelected(id) && this.isListEmpty() && readOnlyPermission && (
                        <Placeholder
                          testId="no-members-placeholder"
                          title={emptyStateMessage().title}
                          text={emptyStateMessage().readOnly}
                        />
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
    emptyTeamMemberships: getCurrentTeamMembershipList(state).length === 0,
    emptyTeamSpaceMemberships: getCurrentTeamSpaceMembershipList(state).length === 0
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(TeamDetails);
