import React from 'react';

import WebhookSidebarDocumentation from './WebhookSidebarDocumentation';

export default function WebhookSidebar () {
  return (
    <div className="entity-sidebar">
      <WebhookSidebarDocumentation />
      <h2 className="entity-sidebar__heading">
        Webhook URL requirements
      </h2>
      <div className="entity-sidebar__text-profile">
        <p>Please note that webhook calls will not be performed against the following URLs:</p>
        <ul>
          <li>Private IPs (10.x, 192.x, etc.)</li>
          <li>Localhost</li>
          <li>Hostnames without a top-level domain</li>
          <li>URLs that resolve to localhost or redirects</li>
        </ul>
      </div>
      <h2 className="entity-sidebar__heading">
        Webhook IP sources
      </h2>
      <div className="entity-sidebar__text-profile">
        <p>
          If you need to restrict access to your webhook endpoint based on an IP{' '}
          <a
            href="http://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            visit AWS reference page
          </a>
          {' '}to obtain information about IP ranges we use to deliver webhook calls.
        </p>
      </div>
    </div>
  );
}
