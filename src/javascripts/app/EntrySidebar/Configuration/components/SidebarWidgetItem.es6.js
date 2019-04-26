import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Icon, Note } from '@contentful/forma-36-react-components';
import * as FeatureFlagKey from 'featureFlags.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';

import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';

export function SidebarWidgetItem({
  id,
  name,
  isDraggable,
  isRemovable,
  isProblem,
  onRemoveClick,
  children
}) {
  const removeBtn = (
    <IconButton
      iconProps={{ icon: 'Close' }}
      className="sidebar-configuration__item-close"
      onClick={onRemoveClick}
      label={`Remove ${name} from your sidebar`}
    />
  );

  if (isProblem) {
    return (
      <Note noteType="warning" className="sidebar-configuration__problem-item">
        <code>{name || id}</code> is saved in configuration, but not installed in this environment.
        {removeBtn}
      </Note>
    );
  }

  return (
    <div className="sidebar-configuration__item" data-test-id="sidebar-widget-item">
      {isDraggable && <Icon className="sidebar-configuration__item-drag" icon="Drag" />}
      {isRemovable && removeBtn}
      <div className="sidebar-configuration__item-name" data-test-id="sidebar-widget-name">
        {name}
      </div>
      <div>{children}</div>
    </div>
  );
}

SidebarWidgetItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  isProblem: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func
};

SidebarWidgetItem.defaultProps = {
  isDraggable: false,
  isRemovable: false,
  isProblem: false
};

export default function WrappedSidebarWidgetItem(props) {
  if (props.id === SidebarWidgetTypes.ACTIVITY) {
    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.ENTRY_ACTIVITY}>
        <SidebarWidgetItem {...props} />
      </BooleanFeatureFlag>
    );
  } else if (props.id === SidebarWidgetTypes.SCHEDULE) {
    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.SCHEDULE}>
        <SidebarWidgetItem {...props} />
      </BooleanFeatureFlag>
    );
  }
  return <SidebarWidgetItem {...props} />;
}

WrappedSidebarWidgetItem.propTypes = {
  id: PropTypes.string.isRequired
};
