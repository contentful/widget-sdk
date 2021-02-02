import React, { useState, action } from 'react';
import _ from 'lodash';
import {
  Paragraph,
  TextInput,
  Typography,
  Button,
  ModalConfirm,
  ModalConfirmProps,
  FieldGroup,
  CheckboxField,
} from '@contentful/forma-36-react-components';

export function DeleteAppsModal(props: ModalConfirmProps) {
  const [isShown, setShown] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [repeat, setRepeat] = useState('');

  return (
    <div>
      <Button buttonType="negative" onClick={() => setShown(true)}>
        Delete something
      </Button>
      <ModalConfirm
        isShown={isShown}
        intent="negative"
        isConfirmDisabled={repeat !== 'unlock'}
        isConfirmLoading={isLoading}
        title="Remove apps from organization"
        confirmLabel="Remove apps from organization"
        onCancel={() => {
          setShown(false);
          action('onCancel')();
        }}
        onConfirm={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setShown(false);
            setRepeat('');
          }, 1500);
          action('onConfirm')();
        }}
        {...props}>
        <Typography>
          <Paragraph>You are about to remove Compose + Launch from your organization</Paragraph>
          <Paragraph>
            Removing apps will remove Compose + Launch from all spaces in your organization. You
            will lose access to the platforms, none of your content will be lost.
          </Paragraph>
          <Paragraph>
            <strong>Why are you removing the apps?</strong>
          </Paragraph>
          <FieldGroup>
            <CheckboxField
              id="Checkbox1"
              value="Does not do what I expected"
              labelText="Does not do what I expected"
            />
            <CheckboxField
              id="Checkbox2"
              value="Not needed anymore"
              labelText="Not needed anymore"
            />
            <CheckboxField
              id="Checkbox2"
              value="Apps are not performing well"
              labelText="Apps are not performing well"
            />
            <CheckboxField
              id="Checkbox2"
              value="I have created my own solution"
              labelText="I have created my own solution"
            />
            <CheckboxField
              id="Checkbox2"
              value="I was just testing it out"
              labelText="I was just testing it out"
            />
          </FieldGroup>
          <br />
          <Paragraph>
            <strong>What can we improve about the apps?</strong>
          </Paragraph>
        </Typography>
        <TextInput value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </ModalConfirm>
    </div>
  );
}
