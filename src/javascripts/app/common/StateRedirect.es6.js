import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';

class StateRedirect extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired,
    params: PropTypes.object,
    options: PropTypes.object
  };

  componentDidMount() {
    const $state = getModule('$state');

    $state.go(this.props.to, this.props.params, this.props.options);
  }

  render() {
    return null;
  }
}

export default StateRedirect;
