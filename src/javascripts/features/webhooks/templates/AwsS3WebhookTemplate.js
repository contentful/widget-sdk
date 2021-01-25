import React from 'react';
import { AwsLogo } from './logos/AwsLogo';
import { List, ListItem } from '@contentful/forma-36-react-components';

export const AwsS3WebhookTemplate = {
  aws: true,
  id: 'aws-s3-store-entries',
  title: 'AWS S3',
  subtitle: 'Store entries',
  logo: <AwsLogo />,
  description: (
    <List>
      <ListItem>Stores entries in an S3 bucket every time they are modified</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
      <ListItem>
        Object key is the entry ID and with <code>.json</code> suffix
      </ListItem>
      <ListItem>Object contains JSON data with all topic, user ID and the entity itself</ListItem>
      <ListItem>Should be used with a versioned bucket</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'region',
      type: 'text',
      title: 'AWS region',
      description: (
        <p>
          The AWS region of your queue. For example: <code>eu-west-1</code>.
        </p>
      ),
    },
    {
      name: 'bucket',
      type: 'text',
      title: 'Bucket',
      description: <p>The name of a bucket you want to store your entries.</p>,
    },
    {
      name: 'accessKeyId',
      type: 'text',
      title: 'AWS Access Key Id',
      description: (
        <p>
          Use a keypair with minimal access. The only required policy action is{' '}
          <code>s3:PutObject</code>
        </p>
      ),
    },
    {
      name: 'secretAccessKey',
      type: 'password',
      title: 'Secret Access Key',
      description: (
        <p>
          Secret Access Key of the keypair used above. This value can’t be revealed once stored.
        </p>
      ),
    },
  ],
  mapParamsToDefinition: ({ region, bucket, accessKeyId, secretAccessKey }, name) => {
    return {
      name,
      url: `https://${bucket}.s3.${region}.awsproxy.contentful.com/{ /payload/sys/id }.json`,
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
        method: 'PUT',
        contentType: 'application/json',
        body: JSON.stringify({
          topic: '{ /topic }',
          user: '{ /user }',
          entity: '{ /payload }',
        }),
      },
    };
  },
};
