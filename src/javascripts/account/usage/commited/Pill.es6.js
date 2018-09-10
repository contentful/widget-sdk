import React from 'react';
import PropTypes from 'prop-types';

export default class Pill extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired
  };

  render() {
    const { text } = this.props;
    return <span className="pill">{text}</span>;
  }
}
