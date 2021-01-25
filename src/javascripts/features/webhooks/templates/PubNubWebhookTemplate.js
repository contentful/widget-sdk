import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { PubNubLogo } from './logos/PubNubLogo';

export const PubNubWebhookTemplate = {
  id: 'pubnub-publish-msg',
  title: 'PubNub',
  subtitle: 'Publish a message',
  logo: <PubNubLogo />,
  description: (
    <List>
      <ListItem>Publishes a message to a PubNub channel</ListItem>
      <ListItem>Triggered for all events</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'pubKey',
      type: 'text',
      title: 'Publish Key',
      description: (
        <Paragraph>
          Can be found{' '}
          <TextLink href="https://admin.pubnub.com" target="_blank" rel="noopener noreferrer">
            in the PubNub Dashboard
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'subKey',
      type: 'text',
      title: 'Subscribe Key',
      description: (
        <Paragraph>The Subscribe Key from the same key pair as the Publish Key above.</Paragraph>
      ),
    },
    {
      name: 'channel',
      type: 'text',
      title: 'Channel name',
      description: (
        <Paragraph>
          Channel to publish messages to.{' '}
          <TextLink
            href="https://www.pubnub.com/developers/tech/key-concepts/publish-subscribe/channels/"
            target="_blank"
            rel="noopener noreferrer">
            Check documentation
          </TextLink>{' '}
          for valid channel names.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ pubKey, subKey, channel }, name) => {
    return {
      name,
      url: `https://ps.pndsn.com/publish/${pubKey}/${subKey}/0/${channel}/0`,
      topics: ['*.*'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          topic: '{ /topic }',
          payload: '{ /payload }',
        }),
      },
    };
  },
};
