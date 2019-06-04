import React from 'react';
import PropTypes from 'prop-types';
import { get, isEmpty } from 'lodash';
import * as analyticsEvents from 'analytics/events/home.es6';

const ExamplesSection = ({ languageResources, selected }) => {
  const examples = get(languageResources, ['examples']);
  return !isEmpty(examples) ? (
    <section className="home-section">
      <h3 className="home-section__heading">Build with Contentful</h3>
      <p className="home-section__description">
        Here are examples of what you can build with Contentful.
      </p>
      <div className="home__examples">
        {examples.map((example, index) => (
          <div key={index} className="home-example">
            <div>
              <div className="home-example__dot" />
              <h4 className="home-example__header">{example.name}</h4>
              <p className="home-example__description">{example.description}</p>
            </div>
            <a
              className="home-example__link"
              href={example.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={analyticsEvents.linkOpened(selected, example.url)}>
              View
            </a>
          </div>
        ))}
      </div>
    </section>
  ) : null;
};

ExamplesSection.propTypes = {
  languageResources: PropTypes.shape({
    examples: PropTypes.array,
    links: PropTypes.array
  }),
  selected: PropTypes.string
};

export default ExamplesSection;
