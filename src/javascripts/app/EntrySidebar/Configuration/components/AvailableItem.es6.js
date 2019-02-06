import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Paragraph } from '@contentful/forma-36-react-components';
import { WidgetTypes } from '../constants.es6';

export default function AvailableItem({ title, onClick, type }) {
  return (
    <div className="sidebar-configuration__available-item">
      <div className="sidebar-configuration__available-item-info">
        <Paragraph extraClassNames="sidebar-configuration__available-item-title">{title}</Paragraph>
        <Paragraph>
          {type === WidgetTypes.builtin && 'Built-in item'}
          {type === WidgetTypes.extension && 'UI Extension'}
        </Paragraph>
      </div>
      <div className="sidebar-configuration__available-item-actions">
        <IconButton
          onClick={onClick}
          iconProps={{ icon: 'PlusCircle' }}
          label={`Add ${title} to your sidebar`}
        />
      </div>
    </div>
  );
}

AvailableItem.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};
