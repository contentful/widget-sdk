import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { GitlabLogo } from './logos/GitlabLogo';

export const GitlabWebhookTemplate = {
  id: 'gitlab-trigger-pipeline',
  title: 'Gitlab',
  subtitle: 'Trigger a pipeline',
  logo: <GitlabLogo />,
  description: (
    <List>
      <ListItem>Triggers a Gitlab pipeline</ListItem>
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
      name: 'gitlabOrg',
      type: 'text',
      title: 'GitLab organization or user',
      description: <Paragraph>The GitLab organization or user repository belongs to.</Paragraph>,
    },
    {
      name: 'gitlabRepo',
      type: 'text',
      title: 'GitLab repository',
      description: <Paragraph>The name of the repository you want to trigger.</Paragraph>,
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
      title: 'Personal API token',
      description: (
        <Paragraph>
          Can be found on the{' '}
          <TextLink
            href="https://gitlab.com/profile/personal_access_tokens"
            target="_blank"
            rel="noopener noreferrer">
            Gitlab Settings
          </TextLink>
          . This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
  ],
  mapParamsToDefinition: ({ gitlabOrg, gitlabRepo, branch, token }, name) => {
    return {
      name,
      url: `https://gitlab.com/api/v4/projects/${gitlabOrg}%2F${gitlabRepo}/pipeline`,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [{ key: 'Private-Token', value: token, secret: true }],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          ref: branch,
          variables: [
            { key: 'CONTENTFUL_ENTITY_ID', value: '{ /payload/sys/id }' },
            { key: 'CONTENTFUL_ENTITY_TYPE', value: '{ /payload/sys/type }' },
            { key: 'CONTENTFUL_SPACE_ID', value: '{ /payload/sys/space/sys/id }' },
            { key: 'CONTENTFUL_ENVIRONMENT_ID', value: '{ /payload/sys/environment/sys/id }' },
          ],
        }),
      },
    };
  },
};
