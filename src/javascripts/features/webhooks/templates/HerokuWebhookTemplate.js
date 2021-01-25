import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { HerokuLogo } from './logos/HerokuLogo';

export const HerokuWebhookTemplate = {
  id: 'heroku-trigger-build',
  title: 'Heroku',
  subtitle: 'Trigger a build',
  logo: <HerokuLogo />,
  description: (
    <List>
      <ListItem>Triggers a Heroku build</ListItem>
      <ListItem>Triggered when an entry or asset is published or unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'appName',
      type: 'text',
      title: 'Heroku application name',
      description: (
        <Paragraph>
          Application name Heroku generated for your project. See{' '}
          <TextLink
            href="https://devcenter.heroku.com/articles/using-the-cli#app-commands"
            target="_blank"
            rel="noopener noreferrer">
            Heroku CLI manual
          </TextLink>{' '}
          for instructions.
        </Paragraph>
      ),
    },
    {
      name: 'apiKey',
      type: 'password',
      title: 'Heroku API key',
      description: (
        <Paragraph>
          Check out the{' '}
          <TextLink
            href="https://devcenter.heroku.com/articles/platform-api-quickstart#authentication"
            target="_blank"
            rel="noopener noreferrer">
            Heroku CLI manual
          </TextLink>{' '}
          for instructions. This value can’t be revealed once stored.
        </Paragraph>
      ),
    },
    {
      name: 'githubOrg',
      type: 'text',
      title: 'GitHub organization or user',
      description: <Paragraph>The Github organization or user repository belongs to.</Paragraph>,
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
  ],
  mapParamsToDefinition: ({ appName, apiKey, githubOrg, githubRepo, branch }, name) => {
    return {
      name,
      url: `https://api.heroku.com/apps/${appName}/builds`,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        { key: 'Accept', value: 'application/vnd.heroku+json; version=3' },
        { key: 'Authorization', value: 'Bearer ' + apiKey, secret: true },
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          source_blob: {
            url: `https://github.com/${githubOrg}/${githubRepo}/archive/${branch}.tar.gz`,
          },
        }),
      },
    };
  },
};
