import React from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator.es6';

class StateRedirect extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired,
    params: PropTypes.object,
    options: PropTypes.object
  };

  componentDidMount() {
    Navigator.go({ path: this.props.to, params: this.props.params, options: this.props.options });
  }

  render() {
    return null;
  }
}

export default StateRedirect;
