import React from 'react';
import PropTypes from 'prop-types';
import { Subheading, SectionHeading } from '@contentful/forma-36-react-components';
import AvailableItem from './AvailableItem.es6';
import { WidgetTypes } from '../constants.es6';

export default function AvailableItems(props) {
  const builtin = props.items.filter(item => item.type === WidgetTypes.builtin);
  const extensions = props.items.filter(item => item.type === WidgetTypes.extension);
  return (
    <div>
      <Subheading extraClassNames="f36-margin-bottom--m">Available items</Subheading>
      {builtin.length > 0 && (
        <React.Fragment>
          <SectionHeading extraClassNames="f36-margin-bottom--xs">Built-in</SectionHeading>
          <div className="sidebar-configuraiton__available-items-section f36-margin-bottom--l">
            {builtin.map(item => (
              <AvailableItem
                key={item.id}
                title={item.title}
                type={WidgetTypes.builtin}
                onClick={() => {
                  props.onAddItem(item);
                }}
              />
            ))}
          </div>
        </React.Fragment>
      )}
      {extensions.length > 0 && (
        <React.Fragment>
          <SectionHeading extraClassNames="f36-margin-bottom--xs">UI Extensions</SectionHeading>
          <div className="sidebar-configuraiton__available-items-section f36-margin-bottom--l">
            {extensions.map(item => (
              <AvailableItem
                key={item.id}
                title={item.title}
                type={WidgetTypes.extension}
                onClick={() => {
                  props.onAddItem(item);
                }}
              />
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

AvailableItems.propTypes = {
  items: PropTypes.array.isRequired,
  onAddItem: PropTypes.func.isRequired
};
