import React from 'react';
import { JiraLogo } from './logos/JiraLogo';
import { List, ListItem, Paragraph } from '@contentful/forma-36-react-components';
import { base64safe } from '../base64safe';

export const BitbucketWebhookTemplate = {
  id: 'bitbucket-trigger-pipeline',
  title: 'Bitbucket',
  subtitle: 'Trigger a pipeline',
  logo: <JiraLogo />,
  description: (
    <List>
      <ListItem>Triggers a Bitbucket pipeline</ListItem>
      <ListItem>Triggered when an entry or asset is published or unpublished</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'bbOrg',
      type: 'text',
      title: 'Bitbucket organization or user',
      description: <Paragraph>The Bitbucket organization or user repository belongs to.</Paragraph>,
    },
    {
      name: 'bbRepo',
      type: 'text',
      title: 'Bitbucket repository',
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
      name: 'user',
      type: 'text',
      title: 'Username',
      description: (
        <Paragraph>
          Pipeline will be triggered using this user. Consider creating a service account.
        </Paragraph>
      ),
    },
    {
      name: 'password',
      type: 'password',
      title: 'Password',
      description: <Paragraph>This value can’t be revealed once stored.</Paragraph>,
    },
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
          value: 'application/json',
        },
        {
          key: 'Authorization',
          value: 'Basic ' + base64safe([user, password].join(':')),
          secret: true,
        },
      ],
      transformation: {
        contentType: 'application/json',
        body: JSON.stringify({
          target: {
            ref_type: 'branch',
            type: 'pipeline_ref_target',
            ref_name: branch,
          },
        }),
      },
    };
  },
};
