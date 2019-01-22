import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ROUTES from 'redux/routes.es6';
import { getPath } from 'redux/selectors/location.es6';
import TeamList from './TeamList.es6';
import TeamDetails from './TeamDetails.es6';
import { isLoadingMissingDatasets } from 'redux/selectors/datasets.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';

class TeamPage extends React.Component {
  static propTypes = {
    onReady: PropTypes.func.isRequired,

    showList: PropTypes.bool.isRequired,
    showDetails: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    readOnlyPermission: PropTypes.bool.isRequired
  };

  componentDidMount() {
    if (!this.props.isLoading) {
      this.props.onReady();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isLoading && !this.props.isLoading) {
      this.props.onReady();
    }
  }

  render() {
    const { showList, showDetails, isLoading, readOnlyPermission } = this.props;
    if (isLoading) {
      return null;
    }
    if (showList) {
      return <TeamList readOnlyPermission={readOnlyPermission} />;
    }
    if (showDetails) {
      return <TeamDetails readOnlyPermission={readOnlyPermission} />;
    }
    return '404 not found';
  }
}

export default connect(state => {
  const path = getPath(state);
  return {
    showList: ROUTES.organization.children.teams.test(path) !== null,
    showDetails: ROUTES.organization.children.teams.children.team.test(path) !== null,
    isLoading: isLoadingMissingDatasets(state),
    readOnlyPermission: hasReadOnlyPermission(state)
  };
})(TeamPage);
