import React from 'react';
import { Subheading } from '@contentful/forma-36-react-components';
import { EntryConfiguration } from '../defaults.es6';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

export default function DefaultSidebar() {
  return (
    <div>
      <Subheading extraClassNames="f36-margin-bottom--m">Default sidebar</Subheading>
      {EntryConfiguration.map(({ title, id, description }) => (
        <SidebarWidgetItem key={id} title={title} description={description} />
      ))}
    </div>
  );
}
