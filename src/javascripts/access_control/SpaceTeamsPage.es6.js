import React from 'react';
import PropTypes from 'prop-types';

export default class SpaceTeamsPage extends React.Component {
  static propTypes = {
    scope: PropTypes.shape({
      context: PropTypes.shape().isRequired,
      $applyAsync: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    const { scope } = this.props;
    scope.context.ready = true;
    scope.$applyAsync();
    return <h1>Hello Teams in Space Settings</h1>;
  }
}
