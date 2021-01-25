import React from 'react';
import { AwsLogo } from './logos/AwsLogo';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';

export const AwsSqsWebhookTemplate = {
  aws: true,
  id: 'aws-sqs-send-message',
  title: 'AWS SQS',
  subtitle: 'Send a message',
  logo: <AwsLogo />,
  description: (
    <List>
      <ListItem>Sends a message to an AWS SQS queue</ListItem>
      <ListItem>Triggered for all entry actions</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
      <ListItem>Message contains the action, entry ID and user ID</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'accountId',
      type: 'text',
      title: 'AWS Account Id',
      description: (
        <Paragraph>
          Can be found in the{' '}
          <TextLink
            href="https://console.aws.amazon.com/billing/home?#/account"
            target="_blank"
            rel="noopener noreferrer">
            AWS Console
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'region',
      type: 'text',
      title: 'AWS region',
      description: (
        <Paragraph>
          The AWS region of your queue. For example: <code>eu-west-1</code>.
        </Paragraph>
      ),
    },
    {
      name: 'queue',
      type: 'text',
      title: 'Queue',
      description: <Paragraph>The name of a queue you want to send your messages to.</Paragraph>,
    },
    {
      name: 'accessKeyId',
      type: 'text',
      title: 'AWS Access Key Id',
      description: (
        <Paragraph>
          Use a keypair with minimal access. The only required policy action is{' '}
          <code>sqs:SendMessage</code>
        </Paragraph>
      ),
    },
    {
      name: 'secretAccessKey',
      type: 'password',
      title: 'Secret Access Key',
      description: (
        <Paragraph>
          Secret Access Key of the keypair used above. This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
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
          value: accessKeyId,
        },
        {
          key: 'X-Contentful-AWS-Proxy-Secret',
          value: secretAccessKey,
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/x-www-form-urlencoded',
        body: JSON.stringify({
          Action: 'SendMessage',
          MessageBody: `{ /topic },{ /payload/sys/id },{ /user/sys/id }`,
        }),
      },
    };
  },
};
