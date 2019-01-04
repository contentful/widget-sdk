import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';

import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import ROUTES from 'redux/routes.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';

import { Button, TableRow, TableCell, Spinner } from '@contentful/forma-36-react-components';

export default connect(
  state => ({
    orgId: getOrgId(state)
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(
  class TeamListRow extends React.Component {
    static propTypes = {
      team: TeamPropType.isRequired,
      orgId: PropTypes.string.isRequired,
      removeTeam: PropTypes.func.isRequired
    };

    render() {
      const { team, orgId, removeTeam } = this.props;

      return (
        <TableRow className="membership-list__item">
          <TableCell>
            {get(team, 'sys.id', false) ? (
              <a
                href={ROUTES.organization.children.teams.children.team.build({
                  orgId,
                  teamId: team.sys.id
                })}>
                {team.name}
              </a>
            ) : (
              <span>
                {team.name} <Spinner size="small" />
              </span>
            )}
          </TableCell>
          <TableCell>{team.description}</TableCell>
          <TableCell align="right">
            <div className="membership-list__item__menu">
              <Button
                buttonType="muted"
                size="small"
                onClick={() => removeTeam(get(team, 'sys.id'))}
                extraClassNames="membership-list__item__menu__button">
                Remove
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }
  }
);
