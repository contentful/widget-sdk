import React from 'react';
import { TwilioLogo } from './logos/TwilioLogo';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { base64safe } from '../base64safe';

export const TwilioWebhookTemplate = {
  id: 'twilio-send-sms',
  title: 'Twilio',
  subtitle: 'Send a SMS',
  logo: <TwilioLogo />,
  description: (
    <List>
      <ListItem>Sends an SMS with Twilio</ListItem>
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
      name: 'from',
      type: 'text',
      title: 'Phone number of the sender',
      description: (
        <Paragraph>
          Use a Twilio{' '}
          <TextLink
            href="https://www.twilio.com/console/sms/getting-started/build"
            target="_blank"
            rel="noopener noreferrer">
            phone number with SMS capability
          </TextLink>
          . Starts with <code>+</code> followed by digits.
        </Paragraph>
      ),
    },
    {
      name: 'to',
      type: 'text',
      title: 'Phone number of the receiver',
      description: (
        <Paragraph>
          The phone number you plan to notify. (<code>+</code> area code)
        </Paragraph>
      ),
    },
    {
      name: 'accountSid',
      type: 'text',
      title: 'Account SID',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer">
            Twilio Dashboard
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'authToken',
      type: 'password',
      title: 'Auth Token',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer">
            Twilio Dashboard
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, from, to, accountSid, authToken } = params;
    const contentType = templateContentTypes.find((ct) => ct.id === contentTypeId);

    return {
      name,
      url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] },
      ],
      headers: [
        {
          key: 'Authorization',
          value: 'Basic ' + base64safe([accountSid, authToken].join(':')),
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({
          From: from,
          To: to,
          Body: `Published a new ${contentType.name}: { ${contentType.titlePointer} }`,
        }),
      },
    };
  },
};
