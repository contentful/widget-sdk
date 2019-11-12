import React from 'react';
import PubNubLogo from './logos/PubNubLogo';

export default {
  id: 'pubnub-publish-msg',
  title: 'PubNub',
  subtitle: 'Publish a message',
  logo: <PubNubLogo />,
  description: (
    <ul>
      <li>Publishes a message to a PubNub channel</li>
      <li>Triggered for all events</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'pubKey',
      type: 'text',
      title: 'Publish Key',
      description: (
        <p>
          Can be found{' '}
          <a href="https://admin.pubnub.com" target="_blank" rel="noopener noreferrer">
            in the PubNub Dashboard
          </a>
          .
        </p>
      )
    },
    {
      name: 'subKey',
      type: 'text',
      title: 'Subscribe Key',
      description: <p>The Subscribe Key from the same key pair as the Publish Key above.</p>
    },
    {
      name: 'channel',
      type: 'text',
      title: 'Channel name',
      description: (
        <p>
          Channel to publish messages to.{' '}
          <a
            href="https://www.pubnub.com/developers/tech/key-concepts/publish-subscribe/channels/"
            target="_blank"
            rel="noopener noreferrer">
            Check documentation
          </a>{' '}
          for valid channel names.
        </p>
      )
    }
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
          payload: '{ /payload }'
        })
      }
    };
  }
};
