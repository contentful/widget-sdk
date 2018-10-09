import React from 'react';

export default function WehhookSidebarDocumentation() {
  return (
    <React.Fragment>
      <h2 className="entity-sidebar__heading">Documentation</h2>
      <div className="entity-sidebar__text-profile">
        <ul>
          <li>
            <a
              href="https://www.contentful.com/developers/docs/concepts/webhooks/"
              target="_blank"
              rel="noopener noreferrer">
              Intro to webhooks
            </a>
          </li>
          <li>
            <a
              href="https://www.contentful.com/developers/docs/references/content-management-api/#/reference/webhooks"
              target="_blank"
              rel="noopener noreferrer">
              Webhook management API reference
            </a>
          </li>
        </ul>
      </div>
    </React.Fragment>
  );
}
