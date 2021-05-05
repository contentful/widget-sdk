import React, { useState } from 'react';
import { Modal, IconButton, Flex } from '@contentful/forma-36-react-components';
import { Choices, DeveloperChoiceDialog } from './DeveloperChoiceDialog';
import { track } from 'analytics/Analytics';
import { SampleSpaceDialog } from './SampleSpaceDialog';
import { go } from 'states/Navigator';
import { markSpace } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';

enum Views {
  DEVELOPER_CHOICE_MODAL = 'developerChoice',
  SAMPLE_SPACE_MODAL = 'sampleSpace',
}
interface Props {
  isShown: boolean;
  onClose: () => void;
  spaceId: string;
}

export const FlexibleOnboardingDialog = ({ isShown, onClose, spaceId }: Props) => {
  const [modalShown, setModalShown] = useState<Views>(Views.DEVELOPER_CHOICE_MODAL);

  const handleBack = () => {
    setModalShown(Views.DEVELOPER_CHOICE_MODAL);
  };

  const handleChoiceSelection = async (choice) => {
    track('onboarding_explore:continue', { flow: `${choice}` });
    switch (choice) {
      case Choices.GATSBY_BLOG_OPTION:
        onClose();
        markSpace(spaceId);
        await go({
          path: ['spaces', 'detail', 'onboarding', 'getStarted'],
          params: { spaceId },
        });
        return;
      case Choices.SAMPLE_SPACE_OPTION:
        setModalShown(Views.SAMPLE_SPACE_MODAL);
        return;
      case Choices.EMPTY_SPACE_OPTION:
        onClose();
        go({ path: 'spaces.detail.content_types.list' });
        return;
      default:
        return;
    }
  };

  return (
    <Modal isShown={isShown} testId="developer-choice-modal" size="1500" onClose={onClose}>
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
        <SampleSpaceDialog onClose={onClose} onBack={handleBack} spaceId={spaceId} />
      )}
    </Modal>
  );
};
