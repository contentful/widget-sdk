import React, { useState } from 'react';
import { Form, ModalConfirm, Paragraph, TextField } from '@contentful/forma-36-react-components';

type FeedbackDialogProps = {
  about: string;
  isShown: boolean;
  onConfirm: (feedback: string) => void;
  onCancel: Function;
};

export function FeedbackDialog(props: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const { about, isShown, onCancel, onConfirm } = props;

  return (
    <ModalConfirm
      title={`Give feedback on ${about}`}
      confirmLabel="Send feedback"
      intent="positive"
      isShown={isShown}
      onConfirm={() => onConfirm(feedback)}
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
          onChange={(e) => setFeedback(e.target.value)}
          value={feedback}
          textInputProps={{
            rows: 6,
          }}
        />
      </Form>
    </ModalConfirm>
  );
}
