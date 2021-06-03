import { getSpaceContext } from 'classes/spaceContext';
import * as TokenStore from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { captureWarning } from 'core/monitoring';

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
