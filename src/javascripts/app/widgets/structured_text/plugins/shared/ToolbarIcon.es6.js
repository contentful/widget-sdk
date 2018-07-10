import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@contentful/ui-component-library';

export default class ToolbarIcon extends Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string
  };

  handleMouseDown = event => {
    event.preventDefault();
    this.props.onToggle(event);
  };

  render () {
    const { icon, isActive, title, type } = this.props;

    return (
      <button
        data-test-id={`toolbar-toggle-${type}`}
        title={title}
        onMouseDown={this.handleMouseDown}
        className="structured-text__toolbar__button"
      >
        <Icon
          icon={icon}
          size="small"
          color={isActive ? 'secondary' : 'muted'}
        />
      </button>
    );
  }
}
