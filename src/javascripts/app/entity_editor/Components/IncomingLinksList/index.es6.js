import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { template } from '../template';
import { Origin as IncomingLinksOrigin } from 'analytics/events/IncomingLinks';

const IncomingLinksList = createReactClass({
  propTypes: {
    links: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        url: PropTypes.string.isRequired
      }).isRequired
    ).isRequired,
    message: PropTypes.string.isRequired,
    origin: PropTypes.oneOf([IncomingLinksOrigin.DIALOG, IncomingLinksOrigin.SIDEBAR]).isRequired,
    onComponentMount: PropTypes.func,
    onClick: PropTypes.func
  },
  componentDidMount() {
    if (this.props.onComponentMount) {
      this.props.onComponentMount();
    }
  },
  handleClick(linkEntityId) {
    if (this.props.onClick) {
      this.props.onClick({
        linkEntityId,
        incomingLinksCount: this.props.links.length
      });
    }
  },
  render() {
    const { links, message } = this.props;
    return (
      <div data-test-id="links">
        <p className="incoming-links__message">
          {template(message, { numberOfLinks: links.length })}
        </p>
        <ul className="incoming-links__list">
          {links.map(({ id, url, ...link }) => {
            const title = link.title || 'Untitled';
            return (
              <li key={url} className="incoming-links__item">
                <a
                  className="incoming-links__link"
                  href={url}
                  target="_blank"
                  rel="noopener"
                  title={title}
                  data-test-id="link"
                  onClick={() => this.handleClick(id)}>
                  {title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
});

export default IncomingLinksList;
