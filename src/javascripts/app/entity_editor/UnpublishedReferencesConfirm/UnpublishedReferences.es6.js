import React from 'react';

import ModalLauncher from 'app/common/ModalLauncher.es6';

import UnpublishedReferencesConfirm from './UnpublishedReferencesConfirm.es6';

export async function showConfirm(unpublishedReferencesInfos) {
  const confirmation = await ModalLauncher.open(({ onClose, isShown }) => (
    <UnpublishedReferencesConfirm
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      unpublishedReferencesInfos={unpublishedReferencesInfos}
    />
  ));

  if (!confirmation) {
    throw new Error('Publication was terminated');
  }

  return confirmation;
}
