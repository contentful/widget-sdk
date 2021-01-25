import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { MailgunLogo } from './logos/MailgunLogo';
import { base64safe } from '../base64safe';

export const MailgunWebhookTemplate = {
  id: 'mailgun-send-mail',
  title: 'Mailgun',
  subtitle: 'Send an email',
  logo: <MailgunLogo />,
  description: (
    <List>
      <ListItem>Sends a mail with Mailgun</ListItem>
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
      name: 'domain',
      type: 'text',
      title: 'Domain',
      description: (
        <Paragraph>
          Can be found on the Mailgun{' '}
          <TextLink
            href="https://app.mailgun.com/app/domains"
            target="_blank"
            rel="noopener noreferrer">
            list of domains
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'from',
      type: 'text',
      title: 'Email address of the sender',
      description: <Paragraph>Notifications will be sent from this email address.</Paragraph>,
    },
    {
      name: 'to',
      type: 'text',
      title: 'Email address of the recipient',
      description: <Paragraph>Email address you want to notify.</Paragraph>,
    },

    {
      name: 'apiKey',
      type: 'password',
      title: 'Private API Key',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink
            href="https://app.mailgun.com/app/account/security"
            target="_blank"
            rel="noopener noreferrer">
            Mailgun Dashboard
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, domain, from, to, apiKey } = params;
    const contentType = templateContentTypes.find((ct) => ct.id === contentTypeId);
    const subject = `Published a new ${contentType.name}: { ${contentType.titlePointer} }`;
    const text = `${subject}\n\nClick to open: ${contentType.appUrlPointers}`;

    return {
      name,
      url: `https://api.mailgun.net/v3/${domain}/messages`,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] },
      ],
      headers: [
        {
          key: 'Authorization',
          value: 'Basic ' + base64safe(['api', apiKey].join(':')),
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({ from, to, subject, text }),
      },
    };
  },
};
