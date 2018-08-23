import React from 'react';
import GitlabLogo from './logos/GitlabLogo';

export default {
  id: 'gitlab-trigger-pipeline',
  title: 'Gitlab',
  subtitle: 'Trigger a pipeline',
  logo: <GitlabLogo />,
  description: (
    <ul>
      <li>Triggers a Gitlab pipeline</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
      <li>
        Passes entity ID, entity type, space ID and environment ID as build-time environment
        variables
      </li>
    </ul>
  ),
  fields: [
    {
      name: 'gitlabOrg',
      type: 'text',
      title: 'GitLab organization or user',
      description: <p>The GitLab organization or user repository belongs to.</p>
    },
    {
      name: 'gitlabRepo',
      type: 'text',
      title: 'GitLab repository',
      description: <p>The name of the repository you want to trigger.</p>
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
    },
    {
      name: 'token',
      type: 'password',
      title: 'Personal API token',
      description: (
        <p>
          Can be found on the{' '}
          <a
            href="https://gitlab.com/profile/personal_access_tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gitlab Settings
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ gitlabOrg, gitlabRepo, branch, token }, name) => {
    return {
      name,
      url: `https://gitlab.com/api/v4/projects/${gitlabOrg}%2F${gitlabRepo}/pipeline`,
      topics: [
        'Entry.publish',
        'Asset.publish',
        'Entry.unpublish',
        'Asset.unpublish'
      ],
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
            { key: 'CONTENTFUL_ENVIRONMENT_ID', value: '{ /payload/sys/environment/sys/id }' }
          ]
        })
      }
    };
  }
};
