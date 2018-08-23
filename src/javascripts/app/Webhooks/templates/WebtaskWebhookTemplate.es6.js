import React from 'react';
import WebtaskLogo from './logos/WebtaskLogo';

export default {
  id: 'webtask-run-function',
  title: 'Webtask',
  subtitle: 'Run a function',
  logo: <WebtaskLogo />,
  description: (
    <ul>
      <li>Runs a Webtask function</li>
      <li>Triggered when an entry is published</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'Webtask function URL',
      description: (
        <p>
          To get the URL{' '}
          <a href="https://webtask.io/make" target="_blank" rel="noopener noreferrer">
            go to Webtask Editor
          </a>
          , select function and copy its URL.
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ url }, name) => {
    return {
      name,
      url,
      topics: ['Entry.publish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json'
      }
    };
  }
};
