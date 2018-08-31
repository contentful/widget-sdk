import React from 'react';
import AwsLogo from './logos/AwsLogo';

export default {
  premium: true,
  id: 'aws-s3-store-entries',
  title: 'AWS S3',
  subtitle: 'Store entries',
  logo: <AwsLogo />,
  description: (
    <ul>
      <li>Stores entries in an S3 bucket every time they are modified</li>
      <li>Scoped to events in the master environment</li>
      <li>Object key contains the entry ID and timestamp</li>
      <li>Object contains the topic, user ID and the entity itself</li>
    </ul>
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
      )
    },
    {
      name: 'bucket',
      type: 'text',
      title: 'Bucket',
      description: <p>The name of a bucket you want to store your entries.</p>
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
  mapParamsToDefinition: ({ region, bucket, accessKeyId, secretAccessKey }, name) => {
    return {
      name,
      url: `https://${bucket}.s3.${region}.awsproxy.contentful.com/{ /payload/sys/id }-{ /payload/sys/updatedAt }.json`,
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
        method: 'PUT',
        contentType: 'application/json',
        body: JSON.stringify({
          topic: '{ /topic }',
          user: '{ /user }',
          entity: '{ /payload }'
        })
      }
    };
  }
};
