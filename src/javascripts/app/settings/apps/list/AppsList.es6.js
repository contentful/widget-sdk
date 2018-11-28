import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class AppsList extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node
  };

  render() {
    return (
      <div className="apps-list">
        <div className="apps-list__header">{this.props.title}</div>
        {this.props.children}
      </div>
    );
  }
}
