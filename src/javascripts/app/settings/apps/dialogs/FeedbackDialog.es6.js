import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { set } from 'lodash/fp';
import {
  ModalConfirm,
  TextField,
  FieldGroup,
  RadioButtonField
} from '@contentful/forma-36-react-components';

export default class FeedbackDialog extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {
    accepted: false,
    feedback: ''
  };

  setAccepted = value => () => this.setState(set('accepted', value));

  render() {
    const { accepted, feedback } = this.state;
    const { about, isShown, onConfirm, onCancel } = this.props;

    return (
      <ModalConfirm
        title={`Give feedback on ${about}`}
        confirmLabel="Send feedback"
        intent="positive"
        isShown={isShown}
        onConfirm={() => onConfirm({ canBeContacted: accepted, feedback })}
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
        <FieldGroup>
          <RadioButtonField
            labelText="Make it anonymous"
            helpText="Your contact information won't be included in the feedback"
            name="decline"
            checked={!accepted}
            onChange={this.setAccepted(false)}
            id="decline"
          />
          <RadioButtonField
            labelText="Include my contact information in the feedback"
            helpText="We might reach out with some additional questions"
            name="accept"
            checked={accepted}
            onChange={this.setAccepted(true)}
            id="accept"
          />
        </FieldGroup>
      </ModalConfirm>
    );
  }
}
