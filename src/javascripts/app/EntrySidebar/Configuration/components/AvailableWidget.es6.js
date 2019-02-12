import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Paragraph } from '@contentful/forma-36-react-components';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

export default function AvailableWidget({ name, onClick, widgetNamespace }) {
  return (
    <div className="sidebar-configuration__available-widget">
      <div className="sidebar-configuration__available-widget-info">
        <Paragraph extraClassNames="sidebar-configuration__available-widget-name">{name}</Paragraph>
        <Paragraph>
          {widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN && 'Built-in item'}
          {widgetNamespace === NAMESPACE_EXTENSION && 'UI Extension'}
        </Paragraph>
      </div>
      <div className="sidebar-configuration__available-widget-actions">
        <IconButton
          onClick={onClick}
          iconProps={{ icon: 'PlusCircle' }}
          label={`Add ${name} to your sidebar`}
        />
      </div>
    </div>
  );
}

AvailableWidget.propTypes = {
  name: PropTypes.string.isRequired,
  widgetNamespace: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};
