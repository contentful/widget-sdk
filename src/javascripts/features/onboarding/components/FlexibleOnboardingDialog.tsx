import React, { useState } from 'react';
import { Modal, IconButton, Flex } from '@contentful/forma-36-react-components';
import { Choices, DeveloperChoiceDialog } from './DeveloperChoiceDialog';
import { track } from 'analytics/Analytics';
import { SampleSpaceDialog } from './SampleSpaceDialog';
import { go } from 'states/Navigator';
import {
  markSpace,
  MODERN_STACK_ONBOARDING_SPACE_NAME,
  unmarkSpace,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getSpaceContext } from 'classes/spaceContext';
import * as TokenStore from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { captureWarning } from 'core/monitoring';

enum Views {
  DEVELOPER_CHOICE_MODAL = 'developerChoice',
  SAMPLE_SPACE_MODAL = 'sampleSpace',
}
interface Props {
  isShown: boolean;
  onClose: () => void;
  spaceId: string;
}

const renameSpace = async (newName, spaceId) => {
  const spaceContext = getSpaceContext();
  const currentSpace = await TokenStore.getSpace(spaceId);
  const updatedSpace = { sys: currentSpace.sys, name: newName };
  const cma = getCMAClient({ spaceId });

  const asyncError = new Error('Something went wrong while updating space');
  try {
    await cma.space.update({}, updatedSpace);
  } catch (err) {
    captureWarning(asyncError, {
      extra: {
        message: err.message,
      },
    });
  }

  await TokenStore.refresh();
  const newSpace = await TokenStore.getSpace(spaceId);
  await spaceContext.resetWithSpace(newSpace);

  return newSpace;
};

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
        renameSpace(MODERN_STACK_ONBOARDING_SPACE_NAME, spaceId);
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
        unmarkSpace();
        renameSpace('Blank space', spaceId);
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
