import React from 'react';
import {
  Modal,
  Typography,
  Paragraph,
  Subheading,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextLink,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';
import { ModalLauncher } from '@contentful/forma-36-react-components';

async function navigateToEntity(entity) {
  const entityRef = Navigator.makeEntityRef(entity);
  await Navigator.go(entityRef);
}

export function BatchErrorsModal({ successMessage, errorMessages, onClose }) {
  return (
    <>
      <Modal.Header title={'Bulk action results'} onClose={onClose} />
      <Modal.Content>
        <Typography>
          {successMessage && <Subheading>Success</Subheading>}
          <Paragraph>{successMessage}</Paragraph>
          <Subheading>Failure</Subheading>
          {errorMessages.map(([entities, errorMessage]) => (
            <div key={errorMessage}>
              <Paragraph>{errorMessage}</Paragraph>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entities.map(([entity, entityTitle]) => {
                    return (
                      <TableRow key={entity.sys.id}>
                        <TableCell>
                          <TextLink
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToEntity(entity);
                              onClose();
                            }}>
                            {entityTitle}
                          </TextLink>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
        </Typography>
      </Modal.Content>
      <Modal.Controls>
        <Button testId="close-modal" onClick={onClose} buttonType="muted">
          Ok, close
        </Button>
      </Modal.Controls>
    </>
  );
}

export const openBatchErrorsModal = ({ successMessage, errorMessages }) => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <Modal testId="bulk-actions-fail-modal" isShown={isShown} onClose={onClose}>
      {() => (
        <BatchErrorsModal
          successMessage={successMessage}
          errorMessages={errorMessages}
          onClose={onClose}
        />
      )}
    </Modal>
  ));
};

BatchErrorsModal.propTypes = {
  successMessage: PropTypes.string,
  errorMessages: PropTypes.array,
  onClose: PropTypes.func.isRequired,
};
