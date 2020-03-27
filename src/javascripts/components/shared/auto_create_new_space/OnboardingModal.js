import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import ChoiceScreen from 'components/shared/stack-onboarding/screens/ChoiceScreen';

const OnboardingModal = ({ onContentChoice, onDevChoice }) => {
  const [isOpen, setOpen] = useState(true);

  const closeModal = () => setOpen(false);

  return (
    <Modal
      testId="onboarding-screen-modal"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
      title="Select your path"
      isShown={isOpen}
      onClose={() => setOpen(false)}
      size="zen">
      <ChoiceScreen
        onContentChoice={() => onContentChoice({ closeModal })}
        onDevChoice={() => onDevChoice({ closeModal })}
      />
    </Modal>
  );
};

OnboardingModal.propTypes = {
  onContentChoice: PropTypes.func.isRequired,
  onDevChoice: PropTypes.func.isRequired,
};

export default OnboardingModal;
