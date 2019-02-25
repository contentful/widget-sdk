import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Icon from 'ui/Components/Icon.es6';

export default class Welcome extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      signInCount: PropTypes.number.isRequired
    })
  };

  scrollToDeveloperResources = () => {
    document
      .querySelector('cf-developer-resources')
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  getTimeOfDay = () => {
    const hour = moment().hour();

    if (hour < 12) {
      return 'morning';
    } else if (hour < 17) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  };

  greet = user => {
    if (user) {
      const isNew = user.signInCount === 1;
      const name = user.firstName;

      if (isNew) {
        return `Welcome, ${name}`;
      } else {
        return `Good ${this.getTimeOfDay()}, ${name}.`;
      }
    } else {
      return 'Welcome';
    }
  };

  render() {
    const { user } = this.props;

    const isNew = user && user.signInCount === 1;
    const isOld = user && user.signInCount > 1;

    return (
      <div>
        <section className="home-section">
          <h2 className="home-section__heading" data-test-id="greeting">
            {this.greet(user)}
          </h2>
          {isNew && (
            <p data-test-id="new-user-msg">
              Looks like you’re new here. Learn more about Contentful from the resources below.
            </p>
          )}
          {isOld && <p data-test-id="old-user-msg">What will you build today?</p>}
          <span data-test-id="link-to-sdk-and-tools-section">
            {'Get started with content creation in your space or get '}
            <a onClick={this.scrollToDeveloperResources}>SDKs, tools & tutorials below</a>.
          </span>
          <Icon name="home-welcome" className="home__welcome-image" />
        </section>
      </div>
    );
  }
}
