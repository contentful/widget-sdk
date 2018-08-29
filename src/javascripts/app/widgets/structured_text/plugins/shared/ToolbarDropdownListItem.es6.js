import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem } from '@contentful/ui-component-library';

export default class ToolbarDropdownListItem extends Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string,
    children: PropTypes.node
  };

  handleMouseDown = event => {
    /*
      We're using the mousedown event rather than onclick because onclick will
      steal the focus.
    */

    event.preventDefault();
    this.props.onToggle(event);
  };

  render() {
    const { isActive, title, type, children } = this.props;
    return (
      <DropdownListItem
        label={title}
        isActive={isActive}
        data-test-id={`toolbar-toggle-${type}`}
        extraClassNames={`toolbar-toggle-${type}`}
        onMouseDown={this.handleMouseDown}>
        {children}
      </DropdownListItem>
    );
  }
}
