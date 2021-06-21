import { getSpaceContext } from 'classes/spaceContext';
import * as TokenStore from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { captureWarning } from 'core/monitoring';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getUser } from 'services/TokenStore';
import { router } from 'core/react-routing';
import { showReplaceSpaceWarning } from '../components/ReplaceSpaceDialog';
import {
  markSpace,
  getStoragePrefix as getOnboardingStoragePrefix,
  MODERN_STACK_ONBOARDING_SPACE_NAME,
  DEFAULT_LOCALE,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getQueryString } from 'utils/location';
import { fetchUserData } from 'features/user-profile';
import { tracking, defaultEventProps } from 'analytics/Analytics';
import { getVariation, FLAGS } from 'core/feature-flags';

const store = getBrowserStorage();

const getStoragePrefix = async () => {
  const user = await getUser();
  return `ctfl:${user.sys.id}:exploreOnboardingSeen`;
};

export const markExploreOnboardingSeen = async () => {
  const prefix = await getStoragePrefix();
  store.set(prefix, true);
};

export const hasSeenExploreOnboarding = async () => {
  const prefix = await getStoragePrefix();
  return store.get(prefix);
};

export const CONTROL_EXP_VARIATION = 'control';
export const TREATMENT_EXP_VARIATION = 'flexible-onboarding';
export const PREASSIGN_ONBOARDING_EXP_VARIATION = 'preassign-onboarding';
export const BLANK_SPACE_NAME = 'Blank';

export const trackContentTypeSave = async ({ organizationId }) => {
  const enabledPreassignExperiment = await getVariation(
    FLAGS.EXPERIMENT_PREASSIGN_ONBOARDING_FLOW,
    {
      organizationId,
    }
  );
  if (enabledPreassignExperiment !== null) {
    tracking.experimentGoalAchieved({
      ...defaultEventProps(),
      experiment_id: FLAGS.EXPERIMENT_PREASSIGN_ONBOARDING_FLOW,
      experiment_variation: enabledPreassignExperiment
        ? PREASSIGN_ONBOARDING_EXP_VARIATION
        : CONTROL_EXP_VARIATION,
      action: 'create_content_type',
    });
  }
};

export const renameSpace = async (newName, spaceId) => {
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

export const handleReplaceSpace = (currentSpaceId) => {
  showReplaceSpaceWarning(currentSpaceId, (spaceId) => {
    markSpace(spaceId);
    renameSpace(MODERN_STACK_ONBOARDING_SPACE_NAME, spaceId);
    router.navigate({
      path: 'spaces.detail.onboarding.copy',
      spaceId,
    });
  });
};

export const handleGetStarted = (currentSpaceId) => {
  markExploreOnboardingSeen();
  renameSpace(MODERN_STACK_ONBOARDING_SPACE_NAME, currentSpaceId);
};

export const isDeveloper = async () => {
  const user = await fetchUserData();
  const hasGithubIdentityConnected =
    user?.identities?.filter((i) => i.provider === 'github').length >= 1;

  const { persona } = getQueryString();

  return persona === 'developer' || hasGithubIdentityConnected;
};

export const goToDeveloperOnboarding = async ({ org, markOnboarding }) => {
  const orgId = org.sys.id;
  const client = getCMAClient();
  const newSpace = await client.space.create(
    {
      organizationId: orgId,
    },
    {
      name: MODERN_STACK_ONBOARDING_SPACE_NAME,
      defaultLocale: DEFAULT_LOCALE,
    }
  );

  markOnboarding();
  markSpace(newSpace.sys.id);

  store.set(`${getOnboardingStoragePrefix()}:currentStep`, {
    path: 'spaces.detail.onboarding.getStarted',
    params: {
      spaceId: newSpace.sys.id,
    },
  });

  await TokenStore.refresh();

  router.navigate({
    path: 'spaces.detail.onboarding.getStarted',
    spaceId: newSpace.sys.id,
  });
};
