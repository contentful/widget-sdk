import React, { Component } from 'react';
import PropTypes from 'prop-types';

import spaceContext from 'spaceContext';
import isEnterprise from 'data/isEnterprise.es6';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import { TextLink, Button, Notification } from '@contentful/forma-36-react-components';
import FeedbackDialog from './dialogs/FeedbackDialog.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';

async function makeParams(feedback, anonymous) {
  const params = { Feedback: feedback, Anonymous: anonymous };
  if (anonymous) {
    return params;
  }

  return {
    ...params,
    URL: window.location.href,
    'Space ID': spaceContext.getData(['sys', 'id']),
    'Space name': spaceContext.getData(['name']),
    'Organization ID': spaceContext.getData(['organization', 'sys', 'id']),
    'Organization name': spaceContext.getData(['organization', 'name']),
    'Is enterprise': await isEnterprise(spaceContext.getData(['organization']))
  };
}

export default class AppsFeedback extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string
  };

  send = async (feedback, anonymous) => {
    const client = createMicroBackendsClient({ backendName: 'feedback' });
    const params = await makeParams(feedback, anonymous);

    const res = await client.call('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (res.ok) {
      Notification.success('Thank you for your feedback!');
    } else {
      Notification.error('Failed to deliver your feedback. Please try again.');
    }
  };

  onClick = async () => {
    const { confirmed, anonymous, feedback } = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={Date.now()}
        initialFeedback={`I’ve got a question/feedback about ${this.props.about}: `}
        isShown={isShown}
        onCancel={onClose}
        onConfirm={onClose}
      />
    ));

    if (confirmed) {
      this.send(feedback, anonymous);
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
