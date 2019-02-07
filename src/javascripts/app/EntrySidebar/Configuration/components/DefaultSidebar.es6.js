import React from 'react';
import { Subheading } from '@contentful/forma-36-react-components';
import { EntryConfiguration } from '../defaults.es6';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

export default function DefaultSidebar() {
  return (
    <React.Fragment>
      <Subheading extraClassNames="f36-margin-bottom--m">Default sidebar</Subheading>
      {EntryConfiguration.map(({ title, widgetId, widgetNamespace, description }) => {
        return (
          <SidebarWidgetItem
            key={`${widgetId}-${widgetNamespace}`}
            title={title}
            description={description}
          />
        );
      })}
    </React.Fragment>
  );
}
