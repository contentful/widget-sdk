import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Paragraph, IconButton, Icon } from '@contentful/forma-36-react-components';

export default class SidebarWidgetItem extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    isDraggable: PropTypes.bool.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    onRemoveClick: PropTypes.func,
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
        {isRemovable && (
          <IconButton
            iconProps={{ icon: 'Close' }}
            extraClassNames="sidebar-configuration__item-close"
            onClick={this.props.onRemoveClick}
            label={`Remove ${title} from your sidebar`}
          />
        )}
        <div className="sidebar-configuration__item-title">{title}</div>
        {description && <Paragraph>{description}</Paragraph>}
      </div>
    );
  }
}
