import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextLink, Button } from '@contentful/forma-36-react-components';

import intercom from 'intercom';

export default class IntercomFeedback extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string
  };

  onClick = () => {
    // Open the Intercom messanger, with message prepopulated.
    intercom.open(`I’ve got a question/feedback about ${this.props.about}: `);
  };

  render() {
    if (!intercom.isEnabled() || !intercom.isLoaded()) {
      return null;
    }

    const label = this.props.label || 'Give feedback';

    if (this.props.type === 'Button') {
      return (
        <Button buttonType="muted" onClick={this.onClick}>
          {label}
        </Button>
      );
    } else {
      return <TextLink onClick={this.onClick}>{label}</TextLink>;
    }
  }
}
