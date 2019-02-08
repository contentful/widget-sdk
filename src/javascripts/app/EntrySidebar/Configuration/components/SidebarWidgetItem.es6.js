import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Icon } from '@contentful/forma-36-react-components';

export default function SidebarWidgetItem({
  title,
  isDraggable,
  isRemovable,
  onRemoveClick,
  children
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
      <div>{children}</div>
    </div>
  );
}

SidebarWidgetItem.propTypes = {
  title: PropTypes.string.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func
};

SidebarWidgetItem.defaultProps = {
  isDraggable: false,
  isRemovable: false
};
