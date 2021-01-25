import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { GoogleCloudLogo } from './logos/GoogleCloudLogo';

export const GoogleCloudWebhookTemplate = {
  id: 'google-cloud-invoke-function',
  title: 'Google Cloud',
  subtitle: 'Run a function',
  logo: <GoogleCloudLogo />,
  description: (
    <List>
      <ListItem>Runs a Google Cloud Function</ListItem>
      <ListItem>Triggered for all events</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'HTTP trigger URL',
      description: (
        <Paragraph>
          To get the URL{' '}
          <TextLink
            href="https://cloud.google.com/functions/docs/calling/http"
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
      topics: ['*.*'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json',
      },
    };
  },
};
