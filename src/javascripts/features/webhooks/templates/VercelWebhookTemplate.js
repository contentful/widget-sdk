import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { VercelLogo } from './logos/VercelLogo';

export const VercelWebhookTemplate = {
  id: 'vercel-deploy-site',
  title: 'Vercel',
  subtitle: 'Deploy a site',
  logo: <VercelLogo />,
  description: (
    <List>
      <ListItem>Deploys a Vercel site</ListItem>
      <ListItem>Triggered when an entry or asset is published or unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'Vercel deploy hook URL',
      description: (
        <Paragraph>
          To get the URL refer to{' '}
          <TextLink
            href="https://vercel.com/docs/more/deploy-hooks/"
            target="_blank"
            rel="noopener noreferrer">
            Vercel’s documentation
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
