import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Notification, TextLink } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import FeedbackDialog from './FeedbackDialog';
import createMicroBackendsClient from 'MicroBackendsClient';
import { getModule } from 'core/NgRegistry';

export default class FeedbackButton extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
    label: PropTypes.string,
  };

  onClick = async () => {
    const { about, target } = this.props;

    const feedback = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={`${Date.now()}`}
        about={about}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={onClose}
      />
    ));

    if (feedback) {
      this.send({ about, target, feedback });
    }
  };

  send = async ({ about, target, feedback }) => {
    const client = createMicroBackendsClient({ backendName: 'feedback' });

    const spaceContext = getModule('spaceContext');
    const res = await client.call('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about,
        target,
        feedback,
        userId: spaceContext.user.sys.id,
        orgId: spaceContext.organization.sys.id,
      }),
    });

    if (res.ok) {
      Notification.success('Thank you for your feedback!');
    } else {
      Notification.error("We couldn't send your feedback. Please try again.");
    }
  };

  render() {
    return <TextLink onClick={this.onClick}>{this.props.label || 'Give feedback'}</TextLink>;
  }
}
