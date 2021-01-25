import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { ElasticLogo } from './logos/ElasticLogo';
import { base64safe } from '../base64safe';

export const ElasticWebhookTemplate = {
  id: 'elasticsearch-index-entries',
  title: 'Elasticsearch',
  subtitle: 'Index entries',
  logo: <ElasticLogo />,
  description: (
    <List>
      <ListItem>
        Creates Elasticsearch document when an entry is published for the first time
      </ListItem>
      <ListItem>Updates existing Elasticsearch document when an entry is republished</ListItem>
      <ListItem>Removes Elasticsearch document when an entry is unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'endpoint',
      type: 'text',
      title: 'Elasticsearch endpoint',
      description: (
        <Paragraph>
          Provide a public Elasticsearch endpoint URL. If you use Elastic Cloud, it can be found on
          the{' '}
          <TextLink
            href="https://cloud.elastic.co/deployments"
            target="_blank"
            rel="noopener noreferrer">
            dashboard
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'index',
      type: 'text',
      title: 'Index name',
      defaultValue: 'contentful-entries',
      description: (
        <Paragraph>Name of an index in which you want to store your documents.</Paragraph>
      ),
    },
    {
      name: 'user',
      type: 'text',
      placeholder: 'elastic',
      title: 'User',
      description: (
        <Paragraph>
          HTTP Basic Auth username. If you use Elastic Cloud, it can be found on the{' '}
          <TextLink
            href="https://cloud.elastic.co/deployments"
            target="_blank"
            rel="noopener noreferrer">
            dashboard
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'password',
      type: 'password',
      title: 'Password',
      description: (
        <Paragraph>
          HTTP Basic Auth password. If you use Elastic Cloud, it can be found on the{' '}
          <TextLink
            href="https://cloud.elastic.co/deployments"
            target="_blank"
            rel="noopener noreferrer">
            dashboard
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
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
