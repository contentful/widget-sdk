import React from 'react';
import SlackLogo from './logos/SlackLogo.es6';

export default {
  id: 'slack-post-message',
  title: 'Slack',
  subtitle: 'Notify a channel',
  logo: <SlackLogo />,
  description: (
    <ul>
      <li>Posts a message to a Slack channel</li>
      <li>Triggered when entries of a selected content type are published</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'contentTypeId',
      type: 'content-type-selector',
      title: 'Content type',
      description: <p>Select the content type of the entries triggering the webhook.</p>
    },
    {
      name: 'url',
      type: 'text',
      title: 'Incoming Slack webhook URL',
      description: (
        <p>
          To get the URL{' '}
          <a
            href="https://api.slack.com/incoming-webhooks"
            target="_blank"
            rel="noopener noreferrer">
            refer to their documentation
          </a>
          .
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ contentTypeId, url }, name, templateContentTypes) => {
    const contentType = templateContentTypes.find(ct => ct.id === contentTypeId);

    return {
      name,
      url,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] }
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          text: `Published a new ${contentType.name}: *<${contentType.appUrlPointers}|{ ${
            contentType.titlePointer
          } }>*`
        })
      }
    };
  }
};
