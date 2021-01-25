import React from 'react';
import { AwsLogo } from './logos/AwsLogo';
import { List, ListItem, Paragraph } from '@contentful/forma-36-react-components';

export const AwsLambdaWebhookTemplate = {
  aws: true,
  id: 'aws-lambda-call-function',
  title: 'AWS Lambda',
  subtitle: 'Invoke a function',
  logo: <AwsLogo />,
  description: (
    <List>
      <ListItem>Runs a Lambda function</ListItem>
      <ListItem>Triggered when an entry is published</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'region',
      type: 'text',
      title: 'AWS region',
      description: (
        <Paragraph>
          The AWS region of your function. For example: <code>eu-west-1</code>.
        </Paragraph>
      ),
    },
    {
      name: 'functionName',
      type: 'text',
      title: 'Function name',
      description: <Paragraph>The name of a function you want to invoke.</Paragraph>,
    },
    {
      name: 'accessKeyId',
      type: 'text',
      title: 'AWS Access Key Id',
      description: (
        <Paragraph>
          Use a keypair with minimal access. The only required policy action is{' '}
          <code>lambda:InvokeFunction</code>.
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
  mapParamsToDefinition: ({ region, functionName, accessKeyId, secretAccessKey }, name) => {
    return {
      name,
      url: `https://lambda.${region}.awsproxy.contentful.com/2015-03-31/functions/${functionName}/invocations`,
      topics: ['Entry.publish'],
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
        contentType: 'application/json',
      },
    };
  },
};
