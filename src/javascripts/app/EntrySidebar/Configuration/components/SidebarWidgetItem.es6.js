import React from 'react';
import PropTypes from 'prop-types';
import { Paragraph, IconButton, Icon } from '@contentful/forma-36-react-components';

export default function SidebarWidgetItem({
  title,
  description,
  isDraggable,
  isRemovable,
  onRemoveClick
}) {
  return (
    <div className="sidebar-configuration__item">
      {isDraggable && <Icon extraClassNames="sidebar-configuration__item-drag" icon="Drag" />}
      {isRemovable && (
        <IconButton
          iconProps={{ icon: 'Close' }}
          extraClassNames="sidebar-configuration__item-close"
          onClick={onRemoveClick}
          label={`Remove ${title} from your sidebar`}
        />
      )}
      <div className="sidebar-configuration__item-title">{title}</div>
      {description && <Paragraph>{description}</Paragraph>}
    </div>
  );
}

SidebarWidgetItem.propTypes = {
  title: PropTypes.string.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func,
  description: PropTypes.string
};

SidebarWidgetItem.defaultProps = {
  isDraggable: false,
  isRemovable: false
};
