import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { TextLink, Button } from '@contentful/forma-36-react-components';

import ModalLauncher from 'app/common/ModalLauncher';
import getOrgId from 'redux/selectors/getOrgId';
import { getCurrentUser } from 'redux/selectors/users';
import { getCurrentTeam } from 'redux/selectors/teams';

import FeedbackDialog from './FeedbackDialog';

class FeedbackButton extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string,

    onFeedbackConfirmed: PropTypes.func.isRequired,
    onClick: PropTypes.func,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    organizationId: PropTypes.string,
    userId: PropTypes.string,
    teamId: PropTypes.string
  };

  onClick = async () => {
    const { about, onFeedbackConfirmed, onClick, onConfirm, onCancel } = this.props;
    if (onClick) onClick(this.state);
    const { feedback, canBeContacted } = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={Date.now()}
        about={about}
        isShown={isShown}
        onCancel={() => {
          onClose(false);
          if (onCancel) onCancel(this.state);
        }}
        onConfirm={onClose}
      />
    ));

    if (feedback) {
      onFeedbackConfirmed(feedback, canBeContacted);
      if (onConfirm) onConfirm(this.state);
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

export default connect(
  state => ({
    organizationId: getOrgId(state),
    userId: get(getCurrentUser(state), 'sys.id'),
    teamId: getCurrentTeam(state)
  }),
  (dispatch, { about, target }) => ({
    onFeedbackConfirmed: (feedback, canBeContacted) =>
      dispatch({
        type: 'SEND_FEEDBACK',
        payload: { feedback, canBeContacted },
        meta: { about, target }
      })
  })
)(FeedbackButton);
