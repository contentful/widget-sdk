import React from 'react';
import { Subheading, Paragraph } from '@contentful/forma-36-react-components';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import { EntryConfiguration } from '../defaults.es6';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

export default function DefaultSidebar() {
  return (
    <React.Fragment>
      <Subheading className="f36-margin-bottom--m">Default sidebar</Subheading>
      {getSidebarWidgets().map(({ name, widgetId, widgetNamespace, description }) => {
        return (
          <SidebarWidgetItem key={`${widgetNamespace},${widgetId}`} name={name} id={widgetId}>
            <Paragraph>{description}</Paragraph>
          </SidebarWidgetItem>
        );
      })}
    </React.Fragment>
  );
}

function getSidebarWidgets() {
  /**
   * We don't want to display Scheduled Publication widget in the
   * Sidebar Configuration in the prototype phase.
   */
  return EntryConfiguration.filter(w => w.widgetId !== SidebarWidgetTypes.SCHEDULED_PUBLICATION);
}
