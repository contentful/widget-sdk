import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class AppsList extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    overlayed: PropTypes.bool
  };

  render() {
    return (
      <div className="apps-list">
        {this.props.overlayed && <div className="apps-list__overlay" />}
        <h3 className="section-title apps-list__title">{this.props.title}</h3>
        {this.props.children}
      </div>
    );
  }
}
