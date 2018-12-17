import React from 'react';
import PropTypes from 'prop-types';

export default class GreetingWidget extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string,
    orgName: PropTypes.string
  };
  render() {
    return (
      <div className="greeting-widget">
        <div className="greeting-widget__header">
          Welcome to your{' '}
          <span className="greeting-widget__space-name">{this.props.spaceName}</span> Space.
        </div>
        <p className="greeting-widget__copy">
          Use this Space to create the content you want to appear on the{' '}
          <span className="greeting-widget__org-name">{this.props.orgName}</span> website.
          <br />
          Go to the Content tab to get started, or learn about working with Contentful below.
        </p>
      </div>
    );
  }
}
