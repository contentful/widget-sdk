import { createElement as h } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import moment from 'moment';
import Icon from 'ui/Components/Icon.es6';
import $ from 'jquery';

const Welcome = createReactClass({
  propTypes: {
    user: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      signInCount: PropTypes.number.isRequired
    }).isRequired
  },
  scrollToDeveloperResources() {
    $('cf-developer-resources')
      .get(0)
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  render() {
    const { user } = this.props;

    const isNew = user && user.signInCount === 1;
    const isOld = user && user.signInCount > 1;

    const greeting = getGreeting(user);

    const scrollToDeveloperResources = h(
      'span',
      null,
      'Get started with content creation in your space or get ',
      h('a', { onClick: this.scrollToDeveloperResources }, 'SDKs, tools & tutorials below'),
      '.'
    );

    return h(
      'div',
      null,
      h(
        'section',
        { className: 'home-section' },
        h('h2', { className: 'home-section__heading', 'data-test-id': 'greeting' }, greeting),
        isNew &&
          h(
            'p',
            null,
            "Looks like you're new here. Learn more about Contentful from the resources below."
          ),
        isOld && h('p', null, 'What will you build today?'),
        scrollToDeveloperResources,
        h(Icon, { name: 'home-welcome', className: 'home__welcome-image' })
      )
    );
  }
});

export default Welcome;

function getGreeting(user) {
  if (user) {
    const isNew = user.signInCount === 1;
    const name = user.firstName;

    if (isNew) {
      return `Welcome, ${name}`;
    } else {
      return 'Good ' + getTimeOfDay() + ', ' + name + '.';
    }
  } else {
    return 'Welcome';
  }
}

function getTimeOfDay() {
  const hour = moment().hour();
  if (hour < 12) {
    return 'morning';
  } else if (hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}
