import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getCurrentUser } from 'redux/selectors/users.es6';
import { getCurrentTeam } from 'redux/selectors/teams.es6';
import { TextLink, Button, Notification } from '@contentful/forma-36-react-components';
import FeedbackDialog from './dialogs/FeedbackDialog.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';

export default connect(state => ({
  organizationId: getOrgId(state),
  userId: get(getCurrentUser(state), 'sys.id'),
  teamId: getCurrentTeam(state)
}))(
  class AppsFeedback extends Component {
    static propTypes = {
      about: PropTypes.string.isRequired,
      type: PropTypes.string,
      label: PropTypes.string,
      target: PropTypes.string.isRequired,
      organizationId: PropTypes.string,
      userId: PropTypes.string,
      teamId: PropTypes.string
    };

    send = async ({ canBeContacted, feedback }) => {
      const { organizationId, userId, teamId } = this.props;
      const client = createMicroBackendsClient({ backendName: 'feedback' });

      const res = await client.call('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          about: this.props.about,
          target: this.props.target,
          canBeContacted,
          ...(canBeContacted ? { organizationId, userId, teamId } : {})
        })
      });

      if (res.ok) {
        Notification.success('Thank you for your feedback!');
      } else {
        Notification.error('Failed to deliver your feedback. Please try again.');
      }
    };

    onClick = async () => {
      const state = await ModalLauncher.open(({ isShown, onClose }) => (
        <FeedbackDialog
          key={Date.now()}
          about={this.props.about}
          isShown={isShown}
          onCancel={() => onClose(false)}
          onConfirm={onClose}
        />
      ));

      if (state) {
        await this.send(state);
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
);
