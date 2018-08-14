import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { Icon } from '@contentful/ui-component-library';
import { EditorToolbarButton } from '@contentful/ui-component-library';

export default class ToolbarIcon extends Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string
  };

  handleMouseDown = event => {
    /*
      We're using the mousedown event rather than onclick because onclick will
      steal the focus.
    */

    event.preventDefault();
    this.props.onToggle(event);
  };

  render () {
    const { icon, isActive, title, type } = this.props;

    return (
      <EditorToolbarButton
        icon={icon}
        tooltip={title}
        label={title}
        isActive={isActive}
        data-test-id={`toolbar-toggle-${type}`}
        onMouseDown={this.handleMouseDown}
      />
    );
  }
}
