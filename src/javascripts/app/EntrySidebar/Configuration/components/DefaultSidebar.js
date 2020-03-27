import React from 'react';
import PropTypes from 'prop-types';
import { Subheading, Paragraph } from '@contentful/forma-36-react-components';

import SidebarWidgetItem from './SidebarWidgetItem';

export default function DefaultSidebar(props) {
  return (
    <React.Fragment>
      <Subheading className="f36-margin-bottom--m">Default sidebar</Subheading>
      {props.items.map(({ name, widgetId, widgetNamespace, description, availabilityStatus }) => {
        return (
          <SidebarWidgetItem
            key={`${widgetNamespace},${widgetId}`}
            name={name}
            id={widgetId}
            availabilityStatus={availabilityStatus}>
            <Paragraph>{description}</Paragraph>
          </SidebarWidgetItem>
        );
      })}
    </React.Fragment>
  );
}

DefaultSidebar.propTypes = {
  items: PropTypes.array.isRequired,
};
