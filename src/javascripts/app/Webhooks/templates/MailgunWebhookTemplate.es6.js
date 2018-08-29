import React from 'react';
import MailgunLogo from './logos/MailgunLogo';

export default {
  id: 'mailgun-send-mail',
  title: 'Mailgun',
  subtitle: 'Send an email',
  logo: <MailgunLogo />,
  description: (
    <ul>
      <li>Sends a mail with Mailgun</li>
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
      name: 'domain',
      type: 'text',
      title: 'Domain',
      description: (
        <p>
          Can be found on the Mailgun{' '}
          <a href="https://app.mailgun.com/app/domains" target="_blank" rel="noopener noreferrer">
            list of domains
          </a>
          .
        </p>
      )
    },
    {
      name: 'from',
      type: 'text',
      title: 'Email address of the sender',
      description: <p>Notifications will be sent from this email address.</p>
    },
    {
      name: 'to',
      type: 'text',
      title: 'Email address of the recipient',
      description: <p>Email address you want to notify.</p>
    },

    {
      name: 'apiKey',
      type: 'password',
      title: 'Private API Key',
      description: (
        <p>
          Can be found on the{' '}
          <a
            href="https://app.mailgun.com/app/account/security"
            target="_blank"
            rel="noopener noreferrer">
            Mailgun Dashboard
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, domain, from, to, apiKey } = params;
    const contentType = templateContentTypes.find(ct => ct.id === contentTypeId);
    const subject = `Published a new ${contentType.name}: { ${contentType.titlePointer} }`;
    const text = `${subject}\n\nClick to open: ${contentType.appUrlPointers}`;

    return {
      name,
      url: `https://api.mailgun.net/v3/${domain}/messages`,
      httpBasicUsername: 'api',
      httpBasicPassword: apiKey,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] }
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({ from, to, subject, text })
      }
    };
  }
};
