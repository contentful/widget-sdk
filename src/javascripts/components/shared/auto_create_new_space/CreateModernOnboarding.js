import React from 'react';
import { refresh } from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { ModalLauncher } from '@contentful/forma-36-react-components';
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

  const onExperimentChoice = async ({ closeModal }) => {
    track('dev_path_selected');

    const orgId = org.sys.id;

    const newSpace = await createBlankSpace({
      closeModal,
      orgId,
      markOnboarding,
    });

    createDeliveryToken();
    createManagementToken();

    return newSpace;
  };

  ModalLauncher.open(() => {
    return (
      <OnboardingModal
        onContentChoice={onContentChoice}
        onDevChoice={onDevChoice}
        onExperimentChoice={onExperimentChoice}
      />
    );
  });
};

async function createSpace({ closeModal, org, markOnboarding, markSpace, userId }) {
  const client = getCMAClient();
  const newSpace = await client.space.create(
    {
      organizationId: org.sys.id,
    },
    {
      name: MODERN_STACK_ONBOARDING_SPACE_NAME,
      defaultLocale: DEFAULT_LOCALE,
    }
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

async function createBlankSpace({ closeModal, orgId, markOnboarding }) {
  const client = getCMAClient();
  const newSpace = await client.space.create(
    {
      organizationId: orgId,
    },
    {
      name: 'Blank space',
      defaultLocale: DEFAULT_LOCALE,
    }
  );

  const newSpaceId = newSpace.sys.id;
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
