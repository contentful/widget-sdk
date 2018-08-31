import React from 'react';
import JiraLogo from './logos/JiraLogo.es6';
import base64safe from '../base64safe.es6';

export default {
  id: 'jira-create-task',
  title: 'Jira',
  subtitle: 'Create a task',
  logo: <JiraLogo />,
  description: (
    <ul>
      <li>Creates a Jira task</li>
      <li>Triggered when new entries of a selected content type are created</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'contentTypeId',
      type: 'content-type-selector',
      title: 'Content type',
      description: <p>Select the content type of the entries triggering the webhook.</p>
    },
    {
      name: 'domain',
      type: 'text',
      title: 'Jira instance domain',
      description: (
        <p>
          Enter the domain without the protocol. For example: <code>your-domain.atlassian.com</code>
          .
        </p>
      )
    },
    {
      name: 'projectId',
      type: 'text',
      title: 'Project ID',
      description: (
        <p>
          The parent project ID for the tasks which will be created. You can{' '}
          <a
            href="https://developer.atlassian.com/cloud/jira/platform/rest/#api-api-2-project-get"
            target="_blank"
            rel="noopener noreferrer">
            list all your projects
          </a>{' '}
          with the API.
        </p>
      )
    },
    {
      name: 'issueTypeId',
      type: 'text',
      title: 'Issue type ID',
      description: (
        <p>
          The issue type ID for the tasks which will be created. You can list issue types for a
          project{' '}
          <a
            href="https://developer.atlassian.com/cloud/jira/platform/rest/#api-api-2-project-get"
            target="_blank"
            rel="noopener noreferrer">
            with the <code>expand</code> API parameter.
          </a>
          .
        </p>
      )
    },
    {
      name: 'user',
      type: 'text',
      title: 'Username',
      description: (
        <p>Tasks will be created using this user. Consider creating a service account.</p>
      )
    },
    {
      name: 'password',
      type: 'password',
      title: 'Password',
      description: <p>This value can’t be revealed once stored.</p>
    }
  ],
  mapParamsToDefinition: (params, name, templateContentTypes) => {
    const { contentTypeId, domain, projectId, issueTypeId, user, password } = params;
    const contentType = templateContentTypes.find(ct => ct.id === contentTypeId);

    return {
      name,
      url: `https://${domain}/rest/api/2/issue`,
      topics: ['Entry.create'],
      filters: [
        { equals: [{ doc: 'sys.environment.sys.id' }, 'master'] },
        { equals: [{ doc: 'sys.contentType.sys.id' }, contentType.id] }
      ],
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
          fields: {
            project: { id: projectId },
            issuetype: { id: issueTypeId },
            summary: `Review a new ${contentType.name}`,
            description: `Click to open: ${contentType.appUrlPointers}`
          }
        })
      }
    };
  }
};
