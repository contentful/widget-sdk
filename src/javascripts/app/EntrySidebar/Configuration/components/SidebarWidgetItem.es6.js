import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Paragraph, Icon } from '@contentful/forma-36-react-components';

export default class SidebarWidgetItem extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    isDraggable: PropTypes.bool.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    description: PropTypes.string
  };

  static defaultProps = {
    isDraggable: false,
    isRemovable: false
  };

  render() {
    const { title, description, isDraggable, isRemovable } = this.props;
    return (
      <div className="sidebar-configuration__item">
        {isDraggable && <Icon extraClassNames="sidebar-configuration__item-drag" icon="Drag" />}
        {isRemovable && <Icon extraClassNames="sidebar-configuration__item-close" icon="Close" />}
        <div className="sidebar-configuration__item-title">{title}</div>
        {description && <Paragraph>{description}</Paragraph>}
      </div>
    );
  }
}
