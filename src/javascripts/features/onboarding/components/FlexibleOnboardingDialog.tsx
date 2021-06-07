import React, { useState } from 'react';
import { Modal, IconButton, Flex, ModalLauncher } from '@contentful/forma-36-react-components';
import { Choices, DeveloperChoiceDialog } from './DeveloperChoiceDialog';
import { track } from 'analytics/Analytics';
import { SampleSpaceDialog } from './SampleSpaceDialog';
import {
  markSpace,
  MODERN_STACK_ONBOARDING_SPACE_NAME,
  unmarkSpace,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { BLANK_SPACE_NAME, renameSpace } from '../utils/util';
import { router } from 'core/react-routing';
import { ReplaceSpaceDialog } from './ReplaceSpaceDialog';

enum Views {
  DEVELOPER_CHOICE_MODAL = 'developerChoice',
  SAMPLE_SPACE_MODAL = 'sampleSpace',
}
interface Props {
  isShown: boolean;
  onClose: () => void;
  spaceId: string;
  replaceSpace?: boolean;
}

export const FlexibleOnboardingDialog = ({
  isShown,
  onClose,
  spaceId,
  replaceSpace = false,
}: Props) => {
  const [modalShown, setModalShown] = useState<Views>(Views.DEVELOPER_CHOICE_MODAL);

  const handleBack = () => {
    setModalShown(Views.DEVELOPER_CHOICE_MODAL);
  };

  const showReplaceSpaceWarning = async (onConfirm) => {
    await ModalLauncher.open(({ onClose }) => (
      <ReplaceSpaceDialog isShown onConfirm={onConfirm} onClose={onClose} spaceId={spaceId} />
    ));
  };

  const handleEmptyChoice = async (spaceId) => {
    unmarkSpace();
    renameSpace(BLANK_SPACE_NAME, spaceId);
    router.navigate({ path: 'content_types.list', spaceId });
  };

  const handleGatsbyChoice = async (spaceId) => {
    markSpace(spaceId);
    renameSpace(MODERN_STACK_ONBOARDING_SPACE_NAME, spaceId);
    router.navigate({
      path: 'spaces.detail.onboarding.getStarted',
      spaceId,
    });
  };

  const handleChoiceSelection = async (choice) => {
    track('onboarding_explore:continue', { flow: `${choice}` });
    switch (choice) {
      case Choices.GATSBY_BLOG_OPTION:
        onClose();
        if (replaceSpace) {
          showReplaceSpaceWarning(handleGatsbyChoice);
        } else {
          handleGatsbyChoice(spaceId);
        }
        return;
      case Choices.SAMPLE_SPACE_OPTION:
        setModalShown(Views.SAMPLE_SPACE_MODAL);
        return;
      case Choices.EMPTY_SPACE_OPTION:
        onClose();
        if (replaceSpace) {
          showReplaceSpaceWarning(handleEmptyChoice);
        } else {
          handleEmptyChoice(spaceId);
        }
        return;
      default:
        return;
    }
  };

  return (
    <Modal
      isShown={isShown}
      testId="developer-choice-modal"
      size="1500"
      onClose={onClose}
      shouldCloseOnOverlayClick>
      <Flex marginTop="spacingS" marginBottom="spacingS" justifyContent="flex-end">
        <IconButton
          buttonType="secondary"
          iconProps={{
            icon: 'Close',
            size: 'small',
          }}
          onClick={onClose}
        />
      </Flex>
      {modalShown === Views.DEVELOPER_CHOICE_MODAL && (
        <DeveloperChoiceDialog onContinue={handleChoiceSelection} />
      )}
      {modalShown === Views.SAMPLE_SPACE_MODAL && (
        <SampleSpaceDialog
          onClose={onClose}
          onBack={handleBack}
          spaceId={spaceId}
          replaceSpace={replaceSpace}
        />
      )}
    </Modal>
  );
};
