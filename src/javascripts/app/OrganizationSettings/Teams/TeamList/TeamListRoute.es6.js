import React from 'react';
import PropTypes from 'prop-types';
import TeamList from './TeamList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';

export default class TeamListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <TeamList orgId={orgId} />
      </OrgAdminOnly>
    );
  }
}
