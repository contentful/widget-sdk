import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import ProgressScreen from 'components/shared/space-wizard/ProgressScreen';
import NewSpaceModal from './NewSpaceModal';

const LegacyNewSpaceModal = ({ isShown, onClose, organization, spaceContext }) => {
  const [showTemplateProgress, setTemplateProgress] = useState(false);
  const [isCreationFinished, setCreationFinished] = useState(false);

  return !showTemplateProgress ? (
    <Modal
      testId="v1-create-space"
      title={`Create a new space`}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
      size="large">
      <NewSpaceModal
        onModalClose={onClose}
        setTemplateProgress={setTemplateProgress}
        setCreationFinished={setCreationFinished}
        organization={organization}
        spaceContext={spaceContext}
      />
    </Modal>
  ) : (
    <Modal
      title={`Loading template`}
      isShown={isShown}
      onClose={onClose}
      size="large"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {({ onClose }) => (
        <Modal.Content>
          <ProgressScreen done={isCreationFinished} onConfirm={onClose} />
        </Modal.Content>
      )}
    </Modal>
  );
};

LegacyNewSpaceModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organization: PropTypes.object.isRequired,
  spaceContext: PropTypes.object.isRequired,
};

export default LegacyNewSpaceModal;
