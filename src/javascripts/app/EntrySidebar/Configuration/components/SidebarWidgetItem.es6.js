import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Icon, Note } from '@contentful/forma-36-react-components';

export default function SidebarWidgetItem({
  id,
  name,
  isDraggable,
  isRemovable,
  isInvalid,
  onRemoveClick,
  children
}) {
  const removeBtn = (
    <IconButton
      iconProps={{ icon: 'Close' }}
      extraClassNames="sidebar-configuration__item-close"
      onClick={onRemoveClick}
      label={`Remove ${name} from your sidebar`}
    />
  );

  if (isInvalid) {
    return (
      <Note noteType="warning" extraClassNames="sidebar-configuration__invalid-item">
        <code>{name || id}</code> is saved in configuration, but not installed in this environment.
        {removeBtn}
      </Note>
    );
  }

  return (
    <div className="sidebar-configuration__item">
      {isDraggable && <Icon extraClassNames="sidebar-configuration__item-drag" icon="Drag" />}
      {isRemovable && removeBtn}
      <div className="sidebar-configuration__item-name">{name}</div>
      <div>{children}</div>
    </div>
  );
}

SidebarWidgetItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  isInvalid: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func
};

SidebarWidgetItem.defaultProps = {
  isDraggable: false,
  isRemovable: false,
  isInvalid: false
};
