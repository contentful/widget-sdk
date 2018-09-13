import React from 'react';
import JiraLogo from './logos/JiraLogo.es6';
import base64safe from '../base64safe.es6';

export default {
  id: 'bitbucket-trigger-pipeline',
  title: 'Bitbucket',
  subtitle: 'Trigger a pipeline',
  logo: <JiraLogo />,
  description: (
    <ul>
      <li>Triggers a Bitbucket pipeline</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'bbOrg',
      type: 'text',
      title: 'Bitbucket organization or user',
      description: <p>The Bitbucket organization or user repository belongs to.</p>
    },
    {
      name: 'bbRepo',
      type: 'text',
      title: 'Bitbucket repository',
      description: <p>The name of the repository you want to trigger.</p>
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
      name: 'user',
      type: 'text',
      title: 'Username',
      description: (
        <p>Pipeline will be triggered using this user. Consider creating a service account.</p>
      )
    },
    {
      name: 'password',
      type: 'password',
      title: 'Password',
      description: <p>This value can’t be revealed once stored.</p>
    }
  ],
  mapParamsToDefinition: (params, name) => {
    const { bbOrg, bbRepo, branch, user, password } = params;

    return {
      name,
      url: `https://api.bitbucket.org/2.0/repositories/${bbOrg}/${bbRepo}/pipelines/`,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      headers: [
        {
          key: 'Accept',
          value: 'application/json'
        },
        {
          key: 'Authorization',
          value: 'Basic ' + base64safe([user, password].join(':')),
          secret: true
        }
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          target: {
            ref_type: 'branch',
            type: 'pipeline_ref_target',
            ref_name: branch
          }
        })
      }
    };
  }
};
