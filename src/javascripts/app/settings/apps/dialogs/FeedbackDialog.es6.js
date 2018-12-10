import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm, Textarea, HelpText } from '@contentful/forma-36-react-components';

export default class FeedbackDialog extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = {};

  render() {
    const feedback = this.state.feedback || '';

    return (
      <ModalConfirm
        title="Give feedback"
        confirmLabel="Give feedback"
        intent="positive"
        isShown={this.props.isShown}
        onConfirm={() => this.props.onConfirm(feedback)}
        isConfirmDisabled={feedback.length < 1}
        onCancel={this.props.onCancel}>
        <Textarea
          name="feedback"
          id="feedback-input"
          placeholder={this.props.placeholder}
          onChange={e => this.setState({ feedback: e.target.value })}
          value={feedback}
          rows={10}
        />
        <HelpText>This is always anonymous.</HelpText>
      </ModalConfirm>
    );
  }
}
