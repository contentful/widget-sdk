import React from 'react';
import CircleCILogo from './logos/CircleCILogo';

// We had to sanitize the token to avoid uncaught exceptions.
// Original source: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
const sanitizedBase64 = input =>
  btoa(
    input.replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1))
  );

export default {
  id: 'circle-ci-trigger-build',
  title: 'CircleCI',
  subtitle: 'Trigger a build',
  logo: <CircleCILogo />,
  description: (
    <ul>
      <li>Triggers a CircleCI build</li>
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
            href="https://circleci.com/account/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            CircleCI Dashboard
          </a>
          . This value can’t be revealed once stored.
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ githubOrg, githubRepo, branch, token }, name) => {
    return {
      name,
      url: `https://circleci.com/api/v1.1/project/github/${githubOrg}/${githubRepo}/tree/${branch}`,
      topics: [
        'Entry.publish',
        'Asset.publish',
        'Entry.unpublish',
        'Asset.unpublish'
      ],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        {
          key: 'Authorization',
          value: 'Basic ' + sanitizedBase64(token),
          secret: true
        }
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          build_parameters: {
            CONTENTFUL_ENTITY_ID: '{ /payload/sys/id }',
            CONTENTFUL_ENTITY_TYPE: '{ /payload/sys/type }',
            CONTENTFUL_SPACE_ID: '{ /payload/sys/space/sys/id }',
            CONTENTFUL_ENVIRONMENT_ID: '{ /payload/sys/environment/sys/id }'
          }
        })
      }
    };
  }
};
