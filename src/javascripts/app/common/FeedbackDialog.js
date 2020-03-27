import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ModalConfirm,
  TextField,
  FieldGroup,
  RadioButtonField,
  Paragraph,
  Form,
} from '@contentful/forma-36-react-components';

export default class FeedbackDialog extends Component {
  static propTypes = {
    about: PropTypes.string.isRequired,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  state = {
    canBeContacted: false,
    feedback: '',
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
        onCancel={onCancel}
        allowHeightOverflow>
        <Form>
          <Paragraph>
            We’re still working on {about} so please let us know if you have any questions or
            comments. It’s an opportunity for you to contribute to the development of the feature.
          </Paragraph>
          <TextField
            textarea
            labelText="Your feedback"
            name="feedback"
            id="feedback-input"
            onChange={(e) => this.setState({ feedback: e.target.value })}
            value={feedback}
            textInputProps={{
              rows: 6,
            }}
          />
          <FieldGroup>
            <RadioButtonField
              labelText="Make it anonymous"
              helpText="Your contact information won't be included in the feedback"
              checked={!canBeContacted}
              onChange={() => this.setState({ canBeContacted: false })}
              name="anonymous"
              id="anonymous"
            />
            <RadioButtonField
              labelText="Include my contact information in the feedback"
              helpText="We might reach out with some additional questions"
              checked={canBeContacted}
              onChange={() => this.setState({ canBeContacted: true })}
              name="can-be-contacted"
              id="can-be-contacted"
            />
          </FieldGroup>
        </Form>
      </ModalConfirm>
    );
  }
}
