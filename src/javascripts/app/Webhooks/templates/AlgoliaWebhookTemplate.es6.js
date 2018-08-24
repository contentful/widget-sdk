import React from 'react';
import AlgoliaLogo from './logos/AlgoliaLogo';

export default {
  id: 'algolia-index-entries',
  title: 'Algolia',
  subtitle: 'Index entries',
  logo: <AlgoliaLogo />,
  description: (
    <ul>
      <li>Creates Algolia record when an entry is published for the first time</li>
      <li>Updates existing Algolia record when an entry is republished</li>
      <li>Removes Algolia record when an entry is unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'appId',
      type: 'text',
      title: 'Algolia Application ID',
      description: (
        <p>
          Can be found on the{' '}
          <a
            href="https://circleci.com/account/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Algolia Dashboard
          </a>
          .
        </p>
      )
    },
    {
      name: 'index',
      type: 'text',
      title: 'Index name',
      description: <p>Name of an index within the selected application.</p>
    },
    {
      name: 'apiKey',
      type: 'password',
      title: 'API Key',
      description: (
        <p>
          Can be found on the{' '}
          <a
            href="https://circleci.com/account/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Algolia Dashboard
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: [
    ({ appId, index, apiKey }, name) => {
      return {
        name,
        url: `https://${appId}.algolia.net/1/indexes/${index}/{ /payload/sys/id }`,
        topics: ['Entry.publish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          {key: 'X-Algolia-Application-Id', value: appId},
          {key: 'X-Algolia-API-Key', value: apiKey, secret: true}
        ],
        transformation: {
          method: 'PUT',
          contentType: 'application/json; charset=utf-8'
        }
      };
    },
    ({ appId, index, apiKey }) => {
      return {
        name: 'Algolia - Delete unpublished entries',
        url: `https://${appId}.algolia.net/1/indexes/${index}/{ /payload/sys/id }`,
        topics: ['Entry.unpublish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          {key: 'X-Algolia-Application-Id', value: appId},
          {key: 'X-Algolia-API-Key', value: apiKey, secret: true}
        ],
        transformation: {
          method: 'DELETE'
        }
      };
    }
  ]
};
