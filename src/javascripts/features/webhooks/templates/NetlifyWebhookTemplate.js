import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import NetlifyLogo from 'svg/logo-netlify.svg';

export const NetlifyWebhookTemplate = {
  id: 'netlify-deploy-site',
  title: 'Netlify',
  subtitle: 'Deploy a site',
  logo: <NetlifyLogo />,
  description: (
    <List>
      <ListItem>Deploys a Netlify site</ListItem>
      <ListItem>Triggered when an entry or asset is published or unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'Netlify build hook URL',
      description: (
        <Paragraph>
          To get the URL{' '}
          <TextLink
            href="https://www.netlify.com/docs/webhooks/"
            target="_blank"
            rel="noopener noreferrer">
            refer to their documentation
          </TextLink>
          .
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ url }, name) => {
    return {
      name,
      url,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json',
      },
    };
  },
};
