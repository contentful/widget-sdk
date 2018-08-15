import React from 'react';
import GoogleCloudLogo from './logos/GoogleCloudLogo';

export default {
  id: 'google-cloud-invoke-function',
  title: 'Google Cloud',
  subtitle: 'Run a function',
  logo: <GoogleCloudLogo />,
  description: (
    <ul>
      <li>Runs a Google Cloud Function</li>
      <li>Triggered for all events</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'HTTP trigger URL',
      description: (
        <p>
          To get the URL{' '}
          <a
            href="https://cloud.google.com/functions/docs/calling/http"
            target="_blank"
            rel="noopener noreferrer"
          >
            refer to their documentation
          </a>
          .
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ url }, name) => {
    return {
      name,
      url,
      topics: ['*.*'],
      filters: [
        {equals: [{doc: 'sys.environment.sys.id'}, 'master']}
      ],
      transformation: {
        contentType: 'application/json'
      }
    };
  }
};
