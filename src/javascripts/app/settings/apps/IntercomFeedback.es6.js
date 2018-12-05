import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextLink } from '@contentful/forma-36-react-components';

import intercom from 'intercom';

export default class IntercomFeedback extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired
  };

  onClick = () => {
    // Track event so the user is identified.
    intercom.trackEvent('apps-early-access');
    // Open the Intercom messanger, with message prepopulated.
    intercom.open(`I’ve got a question/feedback about ${this.props.about}: `);
  };

  render() {
    if (intercom.isEnabled() && intercom.isLoaded()) {
      return <TextLink onClick={this.onClick}>Questions? Feedback?</TextLink>;
    } else {
      return null;
    }
  }
}
