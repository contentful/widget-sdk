import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import moment from 'moment';
import Icon from 'ui/Components/Icon';
import $ from 'jquery';
// Begin test code: feature-ps-10-2017-contact-us-space-home
import ContactUs from '../contactUs';
// End test code: feature-ps-10-2017-contact-us-space-home

const Welcome = createReactClass({
  propTypes: {
    hasContactUs: PropTypes.bool,
    user: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      signInCount: PropTypes.number.isRequired
    }).isRequired
  },
  scrollToDeveloperResources () {
    $('cf-developer-resources').get(0).scrollIntoView(
      {block: 'start', behavior: 'smooth'}
    );
  },
  render () {
    const { user, hasContactUs } = this.props;

    const greeting = getGreeting(user);
    const isNew = user && user.signInCount === 1 && !hasContactUs;
    const isOld = user && user.signInCount > 1 && !hasContactUs;
    const scrollToDeveloperResources = h('span', null,
      'Get started with content creation in your space or get ',
      h('a', {onClick: this.scrollToDeveloperResources}, 'SDKs, tools & tutorials below'),
      '.'
    );
    return h('div', null,
      h('section', {className: 'home-section'},
        h('h2', {className: 'home-section__heading', 'data-test-id': 'greeting'}, greeting),
        isNew && h('p', null, 'Looks like you\'re new here. Learn more about Contentful from the resources below.'),
        isOld && h('p', null, 'What will you build today?'),
        scrollToDeveloperResources,
        !hasContactUs && h(Icon, { name: 'home-welcome', className: 'home__welcome-image' }),
        hasContactUs && h(ContactUs)
      )
    );
  }
});

export default Welcome;

function getGreeting (user) {
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

function getTimeOfDay () {
  const hour = moment().hour();
  if (hour < 12) {
    return 'morning';
  } else if (hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}
