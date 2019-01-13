import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { update, negate, identity } from 'lodash/fp';
import { ModalConfirm, TextField, CheckboxField } from '@contentful/forma-36-react-components';

export default class FeedbackDialog extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {
    canBeContacted: false,
    feedback: ''
  };

  render() {
    const { canBeContacted, feedback } = this.state;
    const { about, isShown, onConfirm, onCancel } = this.props;

    return (
      <ModalConfirm
        title={`Give feedback on ${about}`}
        confirmLabel="Send feedback"
        intent="positive"
        isShown={isShown}
        onConfirm={() => onConfirm({ canBeContacted, feedback })}
        isConfirmDisabled={feedback.length < 1}
        onCancel={onCancel}>
        <span>{`
          We’re still working on ${about} so please let us know if you have any questions or comments. It’s an opportunity for you to contribute to the development of the feature.
        `}</span>
        <TextField
          textarea
          labelText="Your feedback"
          name="feedback"
          id="feedback-input"
          onChange={e => this.setState({ feedback: e.target.value })}
          value={feedback}
          rows={10}
        />
        <CheckboxField
          id="consent-input"
          checked={canBeContacted}
          onChange={() => this.setState(update('canBeContacted', negate(identity)))}
          labelText="I agree to be contacted with follow-up questions"
          labelIsLight={true}
        />
      </ModalConfirm>
    );
  }
}
