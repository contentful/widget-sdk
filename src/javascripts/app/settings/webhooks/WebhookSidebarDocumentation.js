import React from 'react';
import { List, ListItem, TextLink } from '@contentful/forma-36-react-components';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';

export default function WehhookSidebarDocumentation() {
  return (
    <WorkbenchSidebarItem title="Documentation">
      <List>
        <ListItem>
          <TextLink
            href="https://www.contentful.com/developers/docs/concepts/webhooks/"
            target="_blank"
            rel="noopener noreferrer">
            Intro to webhooks
          </TextLink>
        </ListItem>
        <ListItem>
          <TextLink
            href="https://www.contentful.com/developers/docs/references/content-management-api/#/reference/webhooks"
            target="_blank"
            rel="noopener noreferrer">
            Webhook management API reference
          </TextLink>
        </ListItem>
      </List>
    </WorkbenchSidebarItem>
  );
}
