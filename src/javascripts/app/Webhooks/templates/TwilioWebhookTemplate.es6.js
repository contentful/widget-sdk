import React from 'react';
import TwilioLogo from './logos/TwilioLogo';

export default {
  id: 'twilio-send-sms',
  title: 'Twilio',
  subtitle: 'Send a SMS',
  logo: <TwilioLogo />,
  description: (
    <ul>
      <li>Sends an SMS with Twilio</li>
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
      name: 'from',
      type: 'text',
      title: 'Phone number of the sender',
      description: (
        <p>
          Use a Twilio{' '}
          <a
            href="https://www.twilio.com/console/sms/getting-started/build"
            target="_blank"
            rel="noopener noreferrer">
            phone number with SMS capability
          </a>
          . Starts with <code>+</code> followed by digits.
        </p>
      )
    },
    {
      name: 'to',
      type: 'text',
      title: 'Phone number of the receiver',
      description: (
        <p>
          The phone number you plan to notify. (<code>+</code> area code)
        </p>
      )
    },
    {
      name: 'accountSid',
      type: 'text',
      title: 'Account SID',
      description: (
        <p>
          Can be found on the{' '}
          <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer">
            Twilio Dashboard
          </a>
          .
        </p>
      )
    },
    {
      name: 'authToken',
      type: 'password',
      title: 'Auth Token',
      description: (
        <p>
          Can be found on the{' '}
          <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer">
            Twilio Dashboard
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, from, to, accountSid, authToken } = params;
    const contentType = templateContentTypes.find(ct => ct.id === contentTypeId);

    return {
      name,
      url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      httpBasicUsername: accountSid,
      httpBasicPassword: authToken,
      topics: ['Entry.publish'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] }
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({
          From: from,
          To: to,
          Body: `Published a new ${contentType.name}: { ${contentType.titlePointer} }`
        })
      }
    };
  }
};
