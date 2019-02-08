import React from 'react';
import PropTypes from 'prop-types';

export default class GreetingWidget extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string,
    orgName: PropTypes.string,
    walkthroughStarted: PropTypes.bool
  };
  render() {
    const { spaceName, orgName, walkthroughStarted } = this.props;
    return (
      <div className="greeting-widget">
        <div className="greeting-widget__header">
          Welcome to your <span className="greeting-widget__space-name">{spaceName}</span> Space.
        </div>
        <p className="greeting-widget__copy">
          Use this Space to create the content you want to appear on the{' '}
          <span className="greeting-widget__italic">{orgName}</span> website.
          <br />
          {walkthroughStarted === true && (
            <span>
              Go to the <span className="greeting-widget__italic">Content</span> tab to get started,
              or learn about working with Contentful below.
            </span>
          )}
          {walkthroughStarted === false && (
            <span>Get started with a walkthrough tour of your Space.</span>
          )}
        </p>
      </div>
    );
  }
}
