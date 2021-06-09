import { getSpaceContext } from 'classes/spaceContext';
import * as TokenStore from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { captureWarning } from 'core/monitoring';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getUser } from 'services/TokenStore';
import { router } from 'core/react-routing';
import { showReplaceSpaceWarning } from '../components/ReplaceSpaceDialog';
import { markSpace } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';

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

export const handleReplaceSpace = (currentSpaceId) => {
  router.navigate({ path: 'spaces.detail.home' });
  showReplaceSpaceWarning(currentSpaceId, (spaceId) => {
    markSpace(spaceId);
    router.navigate({
      path: 'spaces.detail.onboarding.copy',
      spaceId,
    });
  });
};

export const BLANK_SPACE_NAME = 'Blank';

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
