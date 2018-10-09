import React from 'react';
import NetlifyLogo from './logos/NetlifyLogo.es6';

export default {
  id: 'netlify-deploy-site',
  title: 'Netlify',
  subtitle: 'Deploy a site',
  logo: <NetlifyLogo />,
  description: (
    <ul>
      <li>Deploys a Netlify site</li>
      <li>Triggered when an entry or asset is published or unpublished</li>
      <li>Scoped to events in the master environment</li>
    </ul>
  ),
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'Netlify build hook URL',
      description: (
        <p>
          To get the URL{' '}
          <a
            href="https://www.netlify.com/docs/webhooks/"
            target="_blank"
            rel="noopener noreferrer">
            refer to their documentation
          </a>
          .
        </p>
      )
    }
  ],
  mapParamsToDefinition: ({ url }, name) => {
    return {
      name,
      url,
      topics: ['Entry.publish', 'Asset.publish', 'Entry.unpublish', 'Asset.unpublish'],
      filters: [{ equals: [{ doc: 'sys.environment.sys.id' }, 'master'] }],
      transformation: {
        contentType: 'application/json'
      }
    };
  }
};
