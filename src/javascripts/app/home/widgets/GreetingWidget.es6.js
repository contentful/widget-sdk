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
          Use this Space to create the content you want to appear on your{' '}
          <span className="greeting-widget__italic">{this.props.orgName}</span> project.
          <br />
          Go to the <span className="greeting-widget__italic">Content</span> tab to get started, or
          learn about working with Contentful below.
        </p>
      </div>
    );
  }
}
