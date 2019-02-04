import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { TextLink, Button } from '@contentful/forma-36-react-components';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getCurrentUser } from 'redux/selectors/users.es6';
import { getCurrentTeam } from 'redux/selectors/teams.es6';

import FeedbackDialog from './FeedbackDialog.es6';

class AppsFeedback extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
    type: PropTypes.string,
    label: PropTypes.string,

    onFeedbackConfirmed: PropTypes.func.isRequired,
    organizationId: PropTypes.string,
    userId: PropTypes.string,
    teamId: PropTypes.string
  };

  onClick = async () => {
    const { about, onFeedbackConfirmed } = this.props;
    const { feedback, canBeContacted } = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={Date.now()}
        about={about}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={onClose}
      />
    ));

    if (feedback) {
      onFeedbackConfirmed(feedback, canBeContacted);
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
)(AppsFeedback);
