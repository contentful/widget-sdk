import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm, Textarea, CheckboxField } from '@contentful/forma-36-react-components';

export default class FeedbackDialog extends Component {
  static propTypes = {
    initialFeedback: PropTypes.string,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      feedback: props.initialFeedback || '',
      anonymous: false
    };
  }

  onConfirm = () => {
    this.props.onConfirm({
      confirmed: true,
      feedback: this.state.feedback,
      anonymous: this.state.anonymous
    });
  };

  onCancel = () => {
    this.props.onCancel({
      confirmed: false
    });
  };

  togglePrivacy = () => {
    this.setState(({ anonymous }) => {
      return { anonymous: !anonymous };
    });
  };

  render() {
    return (
      <ModalConfirm
        title="Give feedback"
        confirmLabel="Give feedback"
        intent="positive"
        isShown={this.props.isShown}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}>
        <Textarea
          name="feedback"
          id="feedback-input"
          onChange={e => this.setState({ feedback: e.target.value })}
          value={this.state.feedback}
          rows={10}
        />
        <CheckboxField
          name="privacy"
          id="privacy-checkbox"
          labelText="I want to stay anonymous"
          helpText="We won't be able to reply"
          onChange={this.togglePrivacy}
          checked={this.state.anonymous}
        />
      </ModalConfirm>
    );
  }
}
