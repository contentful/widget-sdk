import React from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';

class StateRedirect extends React.Component {
  static propTypes = {
    path: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
    params: PropTypes.object,
    options: PropTypes.object,
  };

  componentDidMount() {
    Navigator.go({ path: this.props.path, params: this.props.params, options: this.props.options });
  }

  render() {
    return null;
  }
}

export default StateRedirect;
