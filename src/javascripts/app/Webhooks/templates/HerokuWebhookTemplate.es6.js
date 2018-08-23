import React from 'react';
import HerokuLogo from './logos/HerokuLogo';

export default {
  id: 'heroku-trigger-build',
  title: 'Heroku',
  subtitle: 'Trigger a build',
  logo: <HerokuLogo />,
  description: (
    <ul>
      <li>Triggers a Heroku build</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'appName',
      type: 'text',
      title: 'Heroku application name',
      description: (
        <p>
          Application name Heroku generated for your project. See{' '}
          <a
            href="https://devcenter.heroku.com/articles/using-the-cli#app-commands"
            target="_blank"
            rel="noopener noreferrer"
          >
            Heroku CLI manual
          </a>{' '}
          for instructions.
        </p>
      )
    },
    {
      name: 'apiKey',
      type: 'password',
      title: 'Heroku API key',
      description: (
        <p>
          Check out the{' '}
          <a
            href="https://devcenter.heroku.com/articles/platform-api-quickstart#authentication"
            target="_blank"
            rel="noopener noreferrer"
          >
            Heroku CLI manual
          </a>{' '}
          for instructions. This value can’t be revealed once stored.
        </p>
      )
    },
    {
      name: 'githubOrg',
      type: 'text',
      title: 'GitHub organization or user',
      description: <p>The Github organization or user repository belongs to.</p>
    },
    {
      name: 'githubRepo',
      type: 'text',
      title: 'GitHub repository',
      description: <p>The name of the repository you want to build.</p>
    },
    {
      name: 'branch',
      type: 'text',
      title: 'Branch',
      placeholder: 'master',
      description: (
        <p>
          The source code branch, for example <code>master</code>
        </p>
      )
    }
  ],
  mapParamsToDefinition: (
    { appName, apiKey, githubOrg, githubRepo, branch },
    name
  ) => {
    return {
      name,
      url: `https://api.heroku.com/apps/${appName}/builds`,
      topics: [
        'Entry.publish',
        'Asset.publish',
        'Entry.unpublish',
        'Asset.unpublish'
      ],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        { key: 'Accept', value: 'application/vnd.heroku+json; version=3' },
        { key: 'Authorization', value: 'Bearer ' + apiKey, secret: true }
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          source_blob: {
            url: `https://github.com/${githubOrg}/${githubRepo}/archive/${branch}.tar.gz`
          }
        })
      }
    };
  }
};
