import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paragraph,
  TextField,
  Typography,
  ModalConfirm,
  FieldGroup,
  CheckboxField,
} from '@contentful/forma-36-react-components';

export function DeleteAppsModal({ isShown, onClose }) {
  const [textFeedback, setTextFeedback] = useState('');
  const [optionOne, setOptionOne] = useState(false);
  const [optionTwo, setOptionTwo] = useState(false);
  const [optionThree, setOptionThree] = useState(false);
  const [optionFour, setOptionFour] = useState(false);
  const [optionFive, setOptionFive] = useState(false);

  const disableConfirm = !optionOne && !optionTwo && !optionThree && !optionFour && !optionFive;

  return (
    <ModalConfirm
      isShown={isShown}
      intent="negative"
      title="Remove apps from organization"
      confirmLabel="Remove apps from organization"
      isConfirmDisabled={disableConfirm}
      onConfirm={() => {
        console.log('remove everything');
        onClose();
      }}
      onCancel={() => onClose()}>
      <Typography>
        <Paragraph>You are about to remove Compose + Launch from your organization</Paragraph>
        <Paragraph>
          Removing apps will remove Compose + Launch from all spaces in your organization. You will
          lose access to the platforms, none of your content will be lost.
        </Paragraph>
        <Paragraph>
          <strong>Why are you removing the apps?</strong>
        </Paragraph>
        <FieldGroup>
          <CheckboxField
            id="reason1"
            value="Does not do what I expected"
            labelText="Does not do what I expected"
            checked={optionOne}
            onChange={(e) => setOptionOne(e.target.checked)}
          />
          <CheckboxField
            id="reason2"
            value="Not needed anymore"
            labelText="Not needed anymore"
            checked={optionTwo}
            onChange={(e) => setOptionTwo(e.target.checked)}
          />
          <CheckboxField
            id="reason3"
            value="Apps are not performing well"
            labelText="Apps are not performing well"
            checked={optionThree}
            onChange={(e) => setOptionThree(e.target.checked)}
          />
          <CheckboxField
            id="reason4"
            value="I have created my own solution"
            labelText="I have created my own solution"
            checked={optionFour}
            onChange={(e) => setOptionFour(e.target.checked)}
          />
          <CheckboxField
            id="reason5"
            value="I was just testing it out"
            labelText="I was just testing it out"
            checked={optionFive}
            onChange={(e) => setOptionFive(e.target.checked)}
          />
        </FieldGroup>
        <br />
      </Typography>

      <TextField
        id="feedback"
        name="feedback"
        labelText="What can we improve about the apps?"
        value={textFeedback}
        onChange={(e) => setTextFeedback(e.target.value)}
        textarea
      />
    </ModalConfirm>
  );
}

DeleteAppsModal.propTypes = {
  isShown: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};
