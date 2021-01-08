import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Notification, TextLink } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import FeedbackDialog from './FeedbackDialog';
import * as Analytics from 'analytics/Analytics';

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
      Analytics.track('feedback:give', { about, target, feedback });
      Notification.success('Thank you for your feedback!');
    }
  };

  render() {
    return <TextLink onClick={this.onClick}>{this.props.label || 'Give feedback'}</TextLink>;
  }
}
