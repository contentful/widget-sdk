/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';

export const DocsLink = ({ href, title }) => (
  <a
    href={href}
    target="_blank"
    className="knowledge-base-link x--inline"
    rel="noopener noreferrer">
    {title}
  </a>
);
DocsLink.propTypes = {
  href: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

const Sidebar = () => {
  return (
    <>
      <h2 className="entity-sidebar__heading" style={{ marginTop: 0 }}>
        Documentation
      </h2>
      <div className="entity-sidebar__text-profile">
        <p>
          UI Extensions allow you to extend the functionality of the Contentful Web App, 
          automate tasks or easily connect with other services.
        </p>
        <ul>
          <li>
            <DocsLink
              href="https://www.contentful.com/developers/marketplace/#type=ui-extension"
              title="Browse the marketplace"
            />
          </li>
          <li>
            <DocsLink
              href="https://www.contentful.com/developers/docs/extensibility/ui-extensions/"
              title="Get started with extensions"
            />
          </li>
          <li>
            <DocsLink
              href="https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/"
              title="UI Extensions SDK: API Reference"
            />
          </li>
          <li>
            <DocsLink
              href="https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions"
              title="Content Management API: extensions endpoint"
            />
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
