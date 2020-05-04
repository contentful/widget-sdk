import React from 'react';
import { ElasticLogo } from './logos/ElasticLogo';
import { base64safe } from '../base64safe';

export const ElasticWebhookTemplate = {
  id: 'elasticsearch-index-entries',
  title: 'Elasticsearch',
  subtitle: 'Index entries',
  logo: <ElasticLogo />,
  description: (
    <ul>
      <li>Creates Elasticsearch document when an entry is published for the first time</li>
      <li>Updates existing Elasticsearch document when an entry is republished</li>
      <li>Removes Elasticsearch document when an entry is unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'endpoint',
      type: 'text',
      title: 'Elasticsearch endpoint',
      description: (
        <p>
          Provide a public Elasticsearch endpoint URL. If you use Elastic Cloud, it can be found on
          the{' '}
          <a href="https://cloud.elastic.co/deployments" target="_blank" rel="noopener noreferrer">
            dashboard
          </a>
          .
        </p>
      ),
    },
    {
      name: 'index',
      type: 'text',
      title: 'Index name',
      defaultValue: 'contentful-entries',
      description: <p>Name of an index in which you want to store your documents.</p>,
    },
    {
      name: 'user',
      type: 'text',
      placeholder: 'elastic',
      title: 'User',
      description: (
        <p>
          HTTP Basic Auth username. If you use Elastic Cloud, it can be found on the{' '}
          <a href="https://cloud.elastic.co/deployments" target="_blank" rel="noopener noreferrer">
            dashboard
          </a>
          .
        </p>
      ),
    },
    {
      name: 'password',
      type: 'password',
      title: 'Password',
      description: (
        <p>
          HTTP Basic Auth password. If you use Elastic Cloud, it can be found on the{' '}
          <a href="https://cloud.elastic.co/deployments" target="_blank" rel="noopener noreferrer">
            dashboard
          </a>
          . This value can’t be revealed once stored.
        </p>
      ),
    },
  ],
  mapParamsToDefinition: [
    ({ endpoint, index, user, password }, name) => {
      endpoint = endpoint.replace(/\/+$/, '');

      return {
        name,
        url: `${endpoint}/${index}/_doc/{ /payload/sys/id }`,
        topics: ['Entry.publish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          {
            key: 'Authorization',
            value: 'Basic ' + base64safe([user, password].join(':')),
            secret: true,
          },
        ],
        transformation: {
          method: 'PUT',
          contentType: 'application/json; charset=utf-8',
        },
      };
    },
    ({ endpoint, index, user, password }) => {
      endpoint = endpoint.replace(/\/+$/, '');

      return {
        name: 'Elasticsearch - Delete unpublished entries',
        url: `${endpoint}/${index}/_doc/{ /payload/sys/id }`,
        topics: ['Entry.unpublish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          {
            key: 'Authorization',
            value: 'Basic ' + base64safe([user, password].join(':')),
            secret: true,
          },
        ],
        transformation: {
          contentType: 'application/json; charset=utf-8',
          method: 'DELETE',
        },
      };
    },
  ],
};