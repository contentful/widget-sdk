import React from 'react';
import { TextLink, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import { JiraLogo } from './logos/JiraLogo';
import { base64safe } from '../base64safe';

export const JiraWebhookTemplate = {
  id: 'jira-create-task',
  title: 'Jira',
  subtitle: 'Create a task',
  logo: <JiraLogo />,
  description: (
    <List>
      <ListItem>Creates a Jira task</ListItem>
      <ListItem>Triggered when new entries of a selected content type are created</ListItem>
      <ListItem>Scoped to events in the master environment</ListItem>
    </List>
  ),
  fields: [
    {
      name: 'contentTypeId',
      type: 'content-type-selector',
      title: 'Content type',
      description: (
        <Paragraph>Select the content type of the entries triggering the webhook.</Paragraph>
      ),
    },
    {
      name: 'domain',
      type: 'text',
      title: 'Jira instance domain',
      description: (
        <Paragraph>
          Enter the domain without the protocol. For example: <code>your-domain.atlassian.com</code>
          .
        </Paragraph>
      ),
    },
    {
      name: 'projectId',
      type: 'text',
      title: 'Project ID',
      description: (
        <Paragraph>
          The parent project ID for the tasks which will be created. You can{' '}
          <TextLink
            href="https://developer.atlassian.com/cloud/jira/platform/rest/#api-api-2-project-get"
            target="_blank"
            rel="noopener noreferrer">
            list all your projects
          </TextLink>{' '}
          with the API.
        </Paragraph>
      ),
    },
    {
      name: 'issueTypeId',
      type: 'text',
      title: 'Issue type ID',
      description: (
        <Paragraph>
          The issue type ID for the tasks which will be created. You can list issue types for a
          project{' '}
          <TextLink
            href="https://developer.atlassian.com/cloud/jira/platform/rest/#api-api-2-project-get"
            target="_blank"
            rel="noopener noreferrer">
            with the <code>expand</code> API parameter.
          </TextLink>
          .
        </Paragraph>
      ),
    },
    {
      name: 'user',
      type: 'text',
      title: 'Username',
      description: (
        <Paragraph>
          Tasks will be created using this user. Consider creating a service account.
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
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, domain, projectId, issueTypeId, user, password } = params;
    const contentType = templateContentTypes.find((ct) => ct.id === contentTypeId);

    return {
      name,
      url: `https://${domain}/rest/api/2/issue`,
      topics: ['Entry.create'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] },
      ],
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
          fields: {
            project: { id: projectId },
            issuetype: { id: issueTypeId },
            summary: `Review a new ${contentType.name}`,
            description: `Click to open: ${contentType.appUrlPointers}`,
          },
        }),
      },
    };
  },
};
