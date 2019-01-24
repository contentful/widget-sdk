import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { Button, Tooltip } from '@contentful/forma-36-react-components';

import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams, getCurrentTeam } from 'redux/selectors/teams.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import Workbench from 'app/common/Workbench.es6';
import Placeholder from 'app/common/Placeholder.es6';
import Icon from 'ui/Components/Icon.es6';
import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';

import TeamMemberships from './TeamMemberships/TeamMemberships.es6';
import TeamDialog from './TeamDialog.es6';
import ROUTES from 'redux/routes.es6';

const EditButton = ({ onClick }) => (
  <Button size="small" buttonType="muted" disabled={!onClick} onClick={onClick}>
    Edit team details
  </Button>
);
EditButton.propTypes = { onClick: PropTypes.func };

const DeleteButton = ({ onClick }) => (
  <Button size="small" buttonType="negative" disabled={!onClick} onClick={onClick}>
    Delete team
  </Button>
);
DeleteButton.propTypes = { onClick: PropTypes.func };

class TeamDetails extends React.Component {
  static propTypes = {
    readOnlyPermission: PropTypes.bool.isRequired,

    team: TeamPropType,
    orgId: PropTypes.string.isRequired,
    removeTeam: PropTypes.func.isRequired
  };

  state = {
    showTeamDialog: false
  };

  render() {
    const { team, removeTeam, readOnlyPermission, orgId } = this.props;
    const { showTeamDialog } = this.state;
    const creator = team && team.sys.createdBy;
    const pathBack = ROUTES.organization.children.teams.build({ orgId });

    return (
      <Workbench className="organization-users-page" testId="organization-team-page">
        <Workbench.Header>
          <div className="breadcrumbs-widget">
            <div className="breadcrumbs-container">
              <a href={pathBack}>
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
            <div className="user-details">
              <div className="user-details__sidebar">
                <section className="user-details__profile-section">
                  <div className="team-card">
                    <h2 className="team-card__name">{team.name}</h2>
                    {team.description && (
                      <div className="team-card_description">
                        {team.description.split('\n').reduce((acc, cur, idx) => {
                          if (cur === '') {
                            return [...acc, <br key={`${idx}-1`} />, <br key={`${idx}-2`} />];
                          }
                          if (idx === 0) {
                            return [...acc, cur];
                          }
                          return [...acc, <br key={idx} />, cur];
                        }, [])}
                      </div>
                    )}
                    {readOnlyPermission ? (
                      <Tooltip
                        place="right"
                        content="You don't have permission to create or change teams">
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
                    <dd>{moment(team.sys.createdAt).format('MMMM DD, YYYY')}</dd>
                    <dt>Created by</dt>
                    <dd>{getUserName(creator)}</dd>
                  </dl>
                </section>
                {readOnlyPermission ? (
                  <Tooltip
                    place="right"
                    content="You don't have permission to create or change teams">
                    <DeleteButton />
                  </Tooltip>
                ) : (
                  <DeleteButton onClick={() => removeTeam(team.sys.id)} />
                )}
              </div>
              <div className="user-details__content">
                <TeamMemberships readOnlyPermission={readOnlyPermission} />
              </div>
            </div>
          )}
          {!team && (
            <Placeholder
              title="The team you were looking for was not found 🔎"
              text="It might have been deleted or you lost permission to see it"
              button={<Button href={pathBack}>Go to team list</Button>}
            />
          )}
          <TeamDialog
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
    orgId: getOrgId(state)
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(TeamDetails);
