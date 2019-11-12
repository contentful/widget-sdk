import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher';

import Dialog from './Dialog';
import fetchUnpublishedReferences from './FetchUnpublishedReferences';

import { getModule } from 'NgRegistry';

export const showUnpublishedReferencesWarning = async ({
  entity,
  spaceId,
  environmentId,
  confirmLabel,
  modalTitle
}) => {
  const spaceContext = getModule('spaceContext');
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
      confirmLabel={confirmLabel}
      modalTitle={modalTitle}
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
