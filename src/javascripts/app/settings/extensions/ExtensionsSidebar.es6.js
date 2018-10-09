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
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading" style={{ marginTop: 0 }}>
        Documentation
      </h2>
      <div className="entity-sidebar__text-profile">
        <p>
          Contentful UI Extensions are small applications that run inside the Web App and provide
          additional functionality for creating content and integration with third party services.
        </p>
        <ul>
          <li>
            <DocsLink
              href="https://www.contentful.com/developers/docs/concepts/uiextensions/"
              title="Get started with extensions"
            />
          </li>
          <li>
            <DocsLink
              href="https://github.com/contentful/extensions/tree/master/samples"
              title="View examples on GitHub"
            />
          </li>
          <li>
            <DocsLink
              href="https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md"
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
    </div>
  );
};

export default Sidebar;
