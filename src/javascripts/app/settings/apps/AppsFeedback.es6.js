import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import { TextLink, Button, Notification } from '@contentful/forma-36-react-components';
import FeedbackDialog from './dialogs/FeedbackDialog.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';

export default class AppsFeedback extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string
  };

  send = async feedback => {
    const client = createMicroBackendsClient({ backendName: 'feedback' });

    const res = await client.call('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, about: this.props.about })
    });

    if (res.ok) {
      Notification.success('Thank you for your feedback!');
    } else {
      Notification.error('Failed to deliver your feedback. Please try again.');
    }
  };

  onClick = async () => {
    const feedback = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={Date.now()}
        placeholder={`I’ve got a question or feedback about ${this.props.about}...`}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={onClose}
      />
    ));

    if (typeof feedback === 'string') {
      this.send(feedback);
    }
  };

  render() {
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
