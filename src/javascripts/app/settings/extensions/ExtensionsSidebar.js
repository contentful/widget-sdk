/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paragraph,
  TextLink,
  List,
  ListItem,
} from '@contentful/forma-36-react-components';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'extensions-sidebar',
  campaign: 'in-app-help',
});

export const DocsLink = ({ href, title }) => (
  <TextLink href={href} target="_blank" rel="noopener noreferrer">
    {title}
  </TextLink>
);

DocsLink.propTypes = {
  href: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

const Sidebar = () => {
  return (
    <WorkbenchSidebarItem title="Documentation">
      <Typography>
        <Paragraph>
          UI Extensions allow you to extend the functionality of the Contentful Web App, automate
          tasks or easily connect with other services.
        </Paragraph>
        <List>
          <ListItem>
            <DocsLink
              href={withInAppHelpUtmParams(
                'https://www.contentful.com/developers/docs/extensibility/ui-extensions/'
              )}
              title="Get started with extensions"
            />
          </ListItem>
          <ListItem>
            <DocsLink
              href={withInAppHelpUtmParams(
                'https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/'
              )}
              title="UI Extensions SDK: API Reference"
            />
          </ListItem>
          <ListItem>
            <DocsLink
              href={withInAppHelpUtmParams(
                'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions'
              )}
              title="Content Management API: extensions endpoint"
            />
          </ListItem>
        </List>
      </Typography>
    </WorkbenchSidebarItem>
  );
};

export default Sidebar;
