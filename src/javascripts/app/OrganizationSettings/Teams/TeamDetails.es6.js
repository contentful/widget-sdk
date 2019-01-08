import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';

import { Team as TeamPropType, User as UserPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams, getCurrentTeam } from 'redux/selectors/teams.es6';
import { getUsers } from 'redux/selectors/users.es6';
import Workbench from 'app/common/Workbench.es6';
import Icon from 'ui/Components/Icon.es6';

import TeamMemberships from './TeamMemberships/TeamMemberships.es6';

export default connect(
  state => {
    const teams = getTeams(state);
    return {
      loading: isEmpty(teams) || isEmpty(getUsers(state)),
      team: isEmpty(teams) ? undefined : teams[getCurrentTeam(state)]
    };
  },
  dispatch => ({
    goBack: () => dispatch({ type: 'NAVIGATION_BACK' })
  })
)(
  class TeamDetail extends React.Component {
    static propTypes = {
      team: TeamPropType,
      loading: PropTypes.bool,
      onReady: PropTypes.func.isRequired,
      users: PropTypes.objectOf(UserPropType),
      goBack: PropTypes.func.isRequired
    };

    componentDidMount() {
      if (!this.props.loading) {
        this.props.onReady();
      }
    }

    componentDidUpdate(prevProps) {
      if (prevProps.loading && !this.props.loading) {
        this.props.onReady();
      }
    }

    render() {
      const { team, loading, goBack } = this.props;
      const creator = team && team.sys.createdBy;

      return !loading && team ? (
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
            <div className="user-details">
              <div className="user-details__sidebar">
                <section className="user-details__profile-section">
                  <div className="user-card">
                    <div>
                      <h2 className="user-card__name">{team.name}</h2>
                      {team.description && (
                        <p style={{ margin: '10px 0 0' }} className="user-card__email">
                          {team.description}
                        </p>
                      )}
                    </div>
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
              </div>
              <div className="user-details__content">
                <TeamMemberships />
              </div>
            </div>
          </Workbench.Content>
        </Workbench>
      ) : null;
    }
  }
);
