import React from 'react';
import { VercelLogo } from './logos/VercelLogo';

export const VercelWebhookTemplate = {
  id: 'vercel-deploy-site',
  title: 'Vercel',
  subtitle: 'Deploy a site',
  logo: <VercelLogo />,
  description: (
    <ul>
      <li>Deploys a Vercel site</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'Vercel deploy hook URL',
      description: (
        <p>
          To get the URL refer to{' '}
          <a
            href="https://vercel.com/docs/more/deploy-hooks/"
            target="_blank"
            rel="noopener noreferrer">
            Vercel’s documentation
          </a>
          .
        </p>
      ),
    },
  ],
  mapParamsToDefinition: ({ url }, name) => {
    return {
      name,
      url,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json',
      },
    };
  },
};
