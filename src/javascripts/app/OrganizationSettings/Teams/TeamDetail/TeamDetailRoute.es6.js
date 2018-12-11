import React from 'react';
import PropTypes from 'prop-types';
import TeamDetail from './TeamDetail.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';

export default class TeamListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    teamId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, teamId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <TeamDetail teamId={teamId} />
      </OrgAdminOnly>
    );
  }
}
