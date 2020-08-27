import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  Card,
  Button,
  Modal,
  Paragraph,
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import { handleDeleteEnvironment } from './Utils';
import { aliasStyles } from './SharedStyles';
import {
  temporarilyIgnoreAliasChangedToast,
  triggerAliasDeletedToast,
} from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';

DeleteEnvironmentAliasModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  setModalOpen: PropTypes.func.isRequired,
  spaceId: PropTypes.string.isRequired,
  alias: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.id,
      createdAt: PropTypes.any,
      aliasedEnvironment: PropTypes.object,
    }).isRequired,
  }),
};

export default function DeleteEnvironmentAliasModal({ modalOpen, spaceId, setModalOpen, alias }) {
  const [loading, setLoading] = useState(false);
  const deleteEnvironment = async () => {
    setLoading(true);
    try {
      temporarilyIgnoreAliasChangedToast();
      await triggerAliasDeletedToast(handleDeleteEnvironment, {
        spaceId,
        alias,
      });
      setModalOpen(false);
    } catch (err) {
      logger.logError('Aliases - deleteEnvironment exception', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Delete the ${alias.sys.id} alias`}
      onClose={() => setModalOpen(false)}
      shouldCloseOnOverlayClick={false}
      size="large"
      isShown={modalOpen}
      testId="deleteenvironmentmodal.modal">
      {({ title, onClose }) => (
        <React.Fragment>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content testId="deleteeenvironmentmodal.content">
            <Card className={aliasStyles.card}>
              <div className={aliasStyles.modalHeader}>
                <EnvironmentDetails
                  testId="deleteenvironmentmodal.current-alias"
                  environmentId={alias.sys.id}
                  isMaster
                  isSelected
                  aliasId={alias.sys.id}
                  showAliasedTo={false}
                  hasCopy={false}></EnvironmentDetails>
              </div>
              <Paragraph>Current environment:</Paragraph>
              <Table className={aliasStyles.body}>
                <TableBody>
                  <TableRow className={aliasStyles.row}>
                    <TableCell>
                      <EnvironmentDetails
                        testId="changeenvironmentmodal.current-environment"
                        environmentId={alias.sys.aliasedEnvironment.sys.id}
                        createdAt={alias.sys.createdAt}
                        isMaster={alias.sys.aliasedEnvironment.sys.id === 'master'}
                        hasCopy={false}></EnvironmentDetails>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="deleteenvironmentmodal.accept-btn"
              onClick={deleteEnvironment}
              buttonType="negative"
              loading={loading}
              disabled={alias.sys.id === 'master'}>
              Delete alias
            </Button>
            <Button
              testId="deleteenvironmentmodal.cancel-btn"
              onClick={onClose}
              buttonType="muted"
              disabled={loading}>
              Close
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}
