import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { Button } from '@contentful/forma-36-react-components';

import { Team as TeamPropType, User as UserPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams, getCurrentTeam } from 'redux/selectors/teams.es6';
import Workbench from 'app/common/Workbench.es6';
import Placeholder from 'app/common/Placeholder.es6';
import Icon from 'ui/Components/Icon.es6';
import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';

import TeamMemberships from './TeamMemberships/TeamMemberships.es6';

export default connect(
  state => ({
    team: getTeams(state)[getCurrentTeam(state)]
  }),
  dispatch => ({
    goBack: () => dispatch({ type: 'NAVIGATION_BACK' }),
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } }),
    editTeam: teamId => dispatch({ type: 'EDIT_TEAM', payload: { teamId } })
  })
)(
  class TeamDetail extends React.Component {
    static propTypes = {
      team: TeamPropType,
      users: PropTypes.objectOf(UserPropType),
      goBack: PropTypes.func.isRequired,
      removeTeam: PropTypes.func.isRequired,
      editTeam: PropTypes.func.isRequired
    };

    render() {
      const { team, goBack, editTeam, removeTeam } = this.props;
      const creator = team && team.sys.createdBy;

      return (
        <Workbench className="organization-users-page" testId="organization-team-page">
          <Workbench.Header>
            <div className="breadcrumbs-widget">
              <div className="breadcrumbs-container">
                <div data-test-id="teams-back" className="btn btn__back" onClick={goBack}>
                  <Icon name="back" />
                </div>
              </div>
            </div>
            <Workbench.Title>Teams</Workbench.Title>
          </Workbench.Header>
          <Workbench.Content>
            <ExperimentalFeatureNote />
            {team ? (
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
                      <Button size="small" buttonType="muted" onClick={() => editTeam(team.sys.id)}>
                        Edit team details
                      </Button>
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
                  <Button
                    size="small"
                    buttonType="negative"
                    onClick={() => removeTeam(team.sys.id)}>
                    Delete team
                  </Button>
                </div>
                <div className="user-details__content">
                  <TeamMemberships />
                </div>
              </div>
            ) : (
              <Placeholder
                title="The team you were looking for was not found 🔎"
                text="It might have been deleted or you lost permission to see it"
                button={<Button onClick={goBack}>Go to team list</Button>}
              />
            )}
          </Workbench.Content>
        </Workbench>
      );
    }
  }
);
