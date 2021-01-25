import React from 'react';
import AlgoliaLogo from 'svg/logo-algolia.svg';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';

export const AlgoliaWebhookTemplate = {
  id: 'algolia-index-entries',
  title: 'Algolia',
  subtitle: 'Index entries',
  logo: <AlgoliaLogo />,
  description: (
    <List>
      <ListItem>Creates Algolia record when an entry is published for the first time</ListItem>
      <ListItem>Updates existing Algolia record when an entry is republished</ListItem>
      <ListItem>Removes Algolia record when an entry is unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'appId',
      type: 'text',
      title: 'Algolia Application ID',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink
            href="https://www.algolia.com/manage/applications"
            target="_blank"
            rel="noopener noreferrer">
            Algolia Dashboard
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'index',
      type: 'text',
      title: 'Index name',
      description: <Paragraph>Name of an index within the selected application.</Paragraph>,
    },
    {
      name: 'apiKey',
      type: 'password',
      title: 'API Key',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink
            href="https://www.algolia.com/manage/applications"
            target="_blank"
            rel="noopener noreferrer">
            Algolia Dashboard
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: [
    ({ appId, index, apiKey }, name) => {
      return {
        name,
        url: `https://${appId}.algolia.net/1/indexes/${index}/{ /payload/sys/id }`,
        topics: ['Entry.publish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          { key: 'X-Algolia-Application-Id', value: appId },
          { key: 'X-Algolia-API-Key', value: apiKey, secret: true },
        ],
        transformation: {
          method: 'PUT',
          contentType: 'application/json; charset=utf-8',
        },
      };
    },
    ({ appId, index, apiKey }) => {
      return {
        name: 'Algolia - Delete unpublished entries',
        url: `https://${appId}.algolia.net/1/indexes/${index}/{ /payload/sys/id }`,
        topics: ['Entry.unpublish'],
        filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
        headers: [
          { key: 'X-Algolia-Application-Id', value: appId },
          { key: 'X-Algolia-API-Key', value: apiKey, secret: true },
        ],
        transformation: {
          method: 'DELETE',
        },
      };
    },
  ],
};
