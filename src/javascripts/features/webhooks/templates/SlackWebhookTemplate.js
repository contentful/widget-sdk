import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { SlackLogo } from './logos/SlackLogo';

export const SlackWebhookTemplate = {
  id: 'slack-post-message',
  title: 'Slack',
  subtitle: 'Notify a channel',
  logo: <SlackLogo />,
  description: (
    <List>
      <ListItem>Posts a message to a Slack channel</ListItem>
      <ListItem>Triggered when entries of a selected content type are published</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'contentTypeId',
      type: 'content-type-selector',
      title: 'Content type',
      description: (
        <Paragraph>Select the content type of the entries triggering the webhook.</Paragraph>
      ),
    },
    {
      name: 'url',
      type: 'text',
      title: 'Incoming Slack webhook URL',
      description: (
        <Paragraph>
          To get the URL{' '}
          <TextLink
            href="https://api.slack.com/incoming-webhooks"
            target="_blank"
            rel="noopener noreferrer">
            refer to their documentation
          </TextLink>
          .
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ contentTypeId, url }, name, templateContentTypes) => {
    const contentType = templateContentTypes.find((ct) => ct.id === contentTypeId);

    return {
      name,
      url,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] },
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          text: `Published a new ${contentType.name}: *<${contentType.appUrlPointers}|{ ${contentType.titlePointer} }>*`,
        }),
      },
    };
  },
};
