import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, SelectField, Option } from '@contentful/forma-36-react-components';

export default function AppInstallModal({ definition, onClose }) {
  if (!definition) {
    return null;
  }

  return (
    <Modal position="top" isShown title={`Install ${definition.name} to a space`} onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Form>
              <SelectField labelText="Select a space" required>
                <Option value="Select space" />
              </SelectField>
              <SelectField labelText="Select an environment" required>
                <Option value="Select environment" />
              </SelectField>
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={() => {}} buttonType="primary">
              Continue
            </Button>
            <Button onClick={onClose} buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AppInstallModal.propTypes = {
  definition: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};
