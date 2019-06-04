import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import * as analyticsEvents from 'analytics/events/home.es6';

const DocumentationSection = ({ languageResources, selected, docsUrls }) => (
  <section className="home-section">
    <h3 className="home-section__heading">Learning &amp; documentation</h3>
    <p className="home-section__description">What you need to help you get started.</p>
    <div className="home-links">
      {!isEmpty(languageResources.links) && (
        <div className="home-links__col">
          {languageResources.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analyticsEvents.linkOpened(selected, link.url)}>
              {link.name}
            </a>
          ))}
        </div>
      )}
      <div className="home-links__col">
        {docsUrls.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsEvents.linkOpened(selected, link.url)}>
            {link.name}
          </a>
        ))}
      </div>
    </div>
  </section>
);

DocumentationSection.propTypes = {
  languageResources: PropTypes.shape({
    examples: PropTypes.array,
    links: PropTypes.array
  }),
  analytics: PropTypes.any,
  selected: PropTypes.string,
  docsUrls: PropTypes.array
};

export default DocumentationSection;
