import React from 'react';
import { Subheading, Paragraph } from '@contentful/forma-36-react-components';
import { EntryConfiguration } from '../defaults.es6';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

export default function DefaultSidebar() {
  return (
    <React.Fragment>
      <Subheading extraClassNames="f36-margin-bottom--m">Default sidebar</Subheading>
      {EntryConfiguration.map(({ name, widgetId, widgetNamespace, description }) => {
        return (
          <SidebarWidgetItem key={`${widgetNamespace},${widgetId}`} name={name} id={widgetId}>
            <Paragraph>{description}</Paragraph>
          </SidebarWidgetItem>
        );
      })}
    </React.Fragment>
  );
}
