import React from 'react';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import {
  List,
  ListItem,
  TextLink,
  Paragraph,
  Typography
} from '@contentful/forma-36-react-components';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';

export default function WebhookSidebar() {
  return (
    <>
      <WebhookSidebarDocumentation />
      <WorkbenchSidebarItem title="Webhook URL requirements">
        <Typography>
          <Paragraph>
            Please note that webhook calls will not be performed against the following URLs:
          </Paragraph>
          <List>
            <ListItem>Private IPs (10.x, 192.x, etc.)</ListItem>
            <ListItem>Localhost</ListItem>
            <ListItem>Hostnames without a top-level domain</ListItem>
            <ListItem>URLs that resolve to localhost or redirects</ListItem>
          </List>
        </Typography>
      </WorkbenchSidebarItem>
      <WorkbenchSidebarItem title="Webhook IP sources">
        <Typography>
          <Paragraph>
            If you need to restrict access to your webhook endpoint based on an IP{' '}
            <TextLink
              href="http://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html"
              target="_blank"
              rel="noopener noreferrer">
              visit AWS reference page
            </TextLink>{' '}
            to obtain information about IP ranges we use to deliver webhook calls.
          </Paragraph>
        </Typography>
      </WorkbenchSidebarItem>
    </>
  );
}
