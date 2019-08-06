import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import Dialog from './Dialog.es6';
import fetchUnpublishedReferences from './FetchUnpublishedReferences.es6';

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

export const showUnpublishedReferencesWarning = async ({ entity, spaceId, environmentId }) => {
  if (entity.sys.type !== 'Entry') {
    return true;
  }

  const contentTypes = spaceContext.publishedCTs.getAllBare();

  const unpublishedReferencesInfo = await fetchUnpublishedReferences({
    entry: entity,
    contentTypes,
    spaceId,
    environmentId
  });

  if (unpublishedReferencesInfo.length === 0) {
    return true;
  }

  const confirmation = await ModalLauncher.open(({ onClose, isShown }) => (
    <Dialog
      // HACK: has to be unique because modal is never unmounted
      key={Date.now().toString(36)}
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      contentTypes={contentTypes}
      unpublishedReferencesInfo={unpublishedReferencesInfo}
    />
  ));

  if (!confirmation) {
    throw new Error('Publication was terminated');
  }

  return confirmation;
};
