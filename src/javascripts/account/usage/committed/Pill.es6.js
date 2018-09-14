import React from 'react';
import PropTypes from 'prop-types';

export default class Pill extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    tooltip: PropTypes.string
  };

  static defaultProps = {
    tooltip: null
  };

  render() {
    const { text, tooltip } = this.props;
    return (
      <span className="pill" title={tooltip || ''}>
        {text}
      </span>
    );
  }
}
