import React from 'react';
import AwsLogo from './logos/AwsLogo.es6';

export default {
  premium: true,
  id: 'aws-lambda-call-function',
  title: 'AWS Lambda',
  subtitle: 'Invoke a function',
  logo: <AwsLogo />,
  description: (
    <ul>
      <li>Runs a Lambda function</li>
      <li>Triggered when an entry is published</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'region',
      type: 'text',
      title: 'AWS region',
      description: (
        <p>
          The AWS region of your function. For example: <code>eu-west-1</code>.
        </p>
      )
    },
    {
      name: 'functionName',
      type: 'text',
      title: 'Function name',
      description: <p>The name of a function you want to invoke.</p>
    },
    {
      name: 'accessKeyId',
      type: 'text',
      title: 'AWS Access Key Id',
      description: (
        <p>
          Use a keypair with minimal access. The only required policy action is{' '}
          <code>lambda:InvokeFunction</code>.
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
  mapParamsToDefinition: ({ region, functionName, accessKeyId, secretAccessKey }, name) => {
    return {
      name,
      url: `https://lambda.${region}.awsproxy.contentful.com/2015-03-31/functions/${functionName}/invocations`,
      topics: ['Entry.publish'],
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
        contentType: 'application/json'
      }
    };
  }
};
