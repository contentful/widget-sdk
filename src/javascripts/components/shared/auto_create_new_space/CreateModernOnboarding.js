import React from 'react';
import { refresh } from 'services/TokenStore';
import client from 'services/client';
import { ModalLauncher } from 'core/components/ModalLauncher';
import OnboardingModal from './OnboardingModal';
import { go } from 'states/Navigator';

import {
  track,
  markSpace,
  createDeliveryToken,
  createManagementToken,
  MODERN_STACK_ONBOARDING_SPACE_NAME,
} from './CreateModernOnboardingUtils';

const DEFAULT_LOCALE = 'en-US';

export const create = ({ onDefaultChoice, org, user, markOnboarding }) => {
  const onContentChoice = ({ closeModal }) => {
    closeModal();
    track('content_path_selected');
    onDefaultChoice();
  };
  const onDevChoice = async ({ closeModal }) => {
    track('dev_path_selected');

    const newSpace = await createSpace({
      closeModal,
      org,
      markOnboarding,
      markSpace,
      userId: user.sys.id,
    });

    createDeliveryToken();
    createManagementToken();

    return newSpace;
  };

  ModalLauncher.open(() => {
    return <OnboardingModal onContentChoice={onContentChoice} onDevChoice={onDevChoice} />;
  });
};

async function createSpace({ closeModal, org, markOnboarding, markSpace, userId }) {
  const newSpace = await client.createSpace(
    {
      name: MODERN_STACK_ONBOARDING_SPACE_NAME,
      defaultLocale: DEFAULT_LOCALE,
    },
    org.sys.id
  );

  const newSpaceId = newSpace.sys.id;
  // we need to mark space as onboarding before transitioning
  // because otherwise it won't let us do that
  // all onboarding steps are guarded by space id
  markSpace(newSpaceId, userId);
  markOnboarding();

  await refresh();
  await go({
    path: ['spaces', 'detail', 'onboarding', 'getStarted'],
    params: { spaceId: newSpaceId },
  });
  // if we need to close modal, we need to do it after redirect
  closeModal && closeModal();

  return newSpace;
}
