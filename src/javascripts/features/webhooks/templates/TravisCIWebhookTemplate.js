import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { TravisLogo } from './logos/TravisCILogo';

export const TravisCIWebhookTemplate = {
  id: 'travis-ci-trigger-build',
  title: 'Travis CI',
  subtitle: 'Trigger a build',
  logo: <TravisLogo />,
  description: (
    <List>
      <ListItem>Triggers a Travis CI build</ListItem>
      <ListItem>Triggered when an entry or asset is published or unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
      <ListItem>
        Passes entity ID, entity type, space ID and environment ID as build-time environment
        variables
      </ListItem>
    </List>
  ),
  fields: [
    {
      name: 'githubOrg',
      type: 'text',
      title: 'GitHub organization or user',
      description: <Paragraph>The GitHub organization or user repository belongs to.</Paragraph>,
    },
    {
      name: 'githubRepo',
      type: 'text',
      title: 'GitHub repository',
      description: <Paragraph>The name of the repository you want to build.</Paragraph>,
    },
    {
      name: 'branch',
      type: 'text',
      title: 'Branch',
      defaultValue: 'master',
      description: (
        <Paragraph>
          The source code branch, for example <code>master</code>
        </Paragraph>
      ),
    },
    {
      name: 'token',
      type: 'password',
      title: 'Personal API Token',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink href="https://travis-ci.com/profile" target="_blank" rel="noopener noreferrer">
            Travis CI Profile Page
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ githubOrg, githubRepo, branch, token }, name) => {
    return {
      name,
      //    https://api.travis-ci.com/repo/travis-ci%2Ftravis-core/requests
      url: `https://api.travis-ci.com/repo/${githubOrg}%2F${githubRepo}/requests`,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        { key: 'Travis-API-Version', value: '3' },
        {
          key: 'Authorization',
          value: 'token ' + token,
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          request: {
            branch,
            config: {
              env: {
                CONTENTFUL_ENTITY_ID: '{ /payload/sys/id }',
                CONTENTFUL_ENTITY_TYPE: '{ /payload/sys/type }',
                CONTENTFUL_SPACE_ID: '{ /payload/sys/space/sys/id }',
                CONTENTFUL_ENVIRONMENT_ID: '{ /payload/sys/environment/sys/id }',
              },
            },
          },
        }),
      },
    };
  },
};
