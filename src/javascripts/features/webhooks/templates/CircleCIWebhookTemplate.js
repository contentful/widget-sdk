import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { CircleCILogo } from './logos/CircleCILogo';
import { base64safe } from '../base64safe';

export const CircleCIWebhookTemplate = {
  id: 'circle-ci-trigger-build',
  title: 'CircleCI',
  subtitle: 'Trigger a build',
  logo: <CircleCILogo />,
  description: (
    <List>
      <ListItem>Triggers a CircleCI build</ListItem>
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
          <TextLink
            href="https://circleci.com/account/api"
            target="_blank"
            rel="noopener noreferrer">
            CircleCI Dashboard
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ githubOrg, githubRepo, branch, token }, name) => {
    return {
      name,
      url: `https://circleci.com/api/v1.1/project/github/${githubOrg}/${githubRepo}/tree/${branch}`,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        {
          key: 'Authorization',
          value: 'Basic ' + base64safe(token),
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          build_parameters: {
            CONTENTFUL_ENTITY_ID: '{ /payload/sys/id }',
            CONTENTFUL_ENTITY_TYPE: '{ /payload/sys/type }',
            CONTENTFUL_SPACE_ID: '{ /payload/sys/space/sys/id }',
            CONTENTFUL_ENVIRONMENT_ID: '{ /payload/sys/environment/sys/id }',
          },
        }),
      },
    };
  },
};
