import React from 'react';
import TravisCILogo from './logos/TravisCILogo';

export default {
  id: 'travis-ci-trigger-build',
  title: 'Travis CI',
  subtitle: 'Trigger a build',
  logo: <TravisCILogo />,
  description: (
    <ul>
      <li>Triggers a Travis CI build</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
      <li>
        Passes entity ID, entity type, space ID and environment ID as build-time
        environment variables
      </li>
    </ul>
  ),
  fields: [
    {
      name: 'githubOrg',
      type: 'text',
      title: 'GitHub organization or user',
      description: <p>The GitHub organization or user repository belongs to.</p>
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
      defaultValue: 'master',
      description: (
        <p>
          The source code branch, for example <code>master</code>
        </p>
      )
    },
    {
      name: 'token',
      type: 'password',
      title: 'Personal API Token',
      description: (
        <p>
          Can be found on the{' '}
          <a
            href="https://travis-ci.com/profile"
            target="_blank"
            rel="noopener noreferrer"
          >
            Travis CI Profile Page
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ githubOrg, githubRepo, branch, token }, name) => {
    return {
      name,
      //    https://api.travis-ci.com/repo/travis-ci%2Ftravis-core/requests
      url: `https://api.travis-ci.com/repo/${githubOrg}%2F${githubRepo}/requests`,
      topics: [
        'Entry.publish',
        'Asset.publish',
        'Entry.unpublish',
        'Asset.unpublish'
      ],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        { key: 'Travis-API-Version', value: '3' },
        {
          key: 'Authorization',
          value: 'token ' + token,
          secret: true
        }
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
                CONTENTFUL_ENVIRONMENT_ID: '{ /payload/sys/environment/sys/id }'
              }
            }
          }
        })
      }
    };
  }
};
