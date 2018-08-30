import React from 'react';
import AwsLogo from './logos/AwsLogo';

export default {
  id: 'aws-sqs-send-message',
  title: 'AWS SQS',
  subtitle: 'Send a message',
  logo: <AwsLogo />,
  description: (
    <ul>
      <li>Sends a message to an AWS SQS queue</li>
      <li>Triggered for all entry actions</li>
      <li>Scoped to events in the master environment</li>
      <li>Message contains the action, entry ID and user ID</li>
    </ul>
  ),
  fields: [
    {
      name: 'accountId',
      type: 'text',
      title: 'AWS Account Id',
      description: (
        <p>
          Can be found in the{' '}
          <a
            href="https://console.aws.amazon.com/billing/home?#/account"
            target="_blank"
            rel="noopener noreferrer">
            AWS Console
          </a>
          .
        </p>
      )
    },
    {
      name: 'region',
      type: 'text',
      title: 'AWS region',
      description: (
        <p>
          The AWS region of your queue. For example: <code>eu-west-1</code>.
        </p>
      )
    },
    {
      name: 'queue',
      type: 'text',
      title: 'Queue',
      description: <p>The name of a queue you want to send your messages to.</p>
    },
    {
      name: 'accessKeyId',
      type: 'text',
      title: 'AWS Access Key Id',
      description: (
        <p>
          Use a keypair with minimal access. The only required policy action is{' '}
          <code>sqs:SendMessage</code>
        </p>
      )
    },
    {
      name: 'secretAccessKey',
      type: 'password',
      title: 'Secret Access Key',
      description: (
        <p>
          Secret Access Key of the keypair used above. This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ accountId, region, queue, accessKeyId, secretAccessKey }, name) => {
    return {
      name,
      url: `https://sqs.${region}.awsproxy.contentful.com/${accountId}/${queue}`,
      topics: ['Entry.*'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        {
          key: 'X-Contentful-AWS-Proxy-Key-Id',
          value: accessKeyId
        },
        {
          key: 'X-Contentful-AWS-Proxy-Secret',
          value: secretAccessKey,
          secret: true
        },
        {
          key: 'X-Contentful-Enable-Alpha-Feature',
          value: 'awsproxy-release-2018-08-30',
          secret: true
        }
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({
          Action: 'SendMessage',
          MessageBody: `{ /topic },{ /payload/sys/id },{ /user/sys/id }`
        })
      }
    };
  }
};
