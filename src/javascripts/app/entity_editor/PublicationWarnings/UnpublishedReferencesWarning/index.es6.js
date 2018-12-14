import React from 'react';

import ModalLauncher from 'app/common/ModalLauncher.es6';

import UnpublishedReferencesConfirm from './UnpublishedReferencesConfirm.es6';

const showConfirm = async unpublishedReferencesInfo => {
  const confirmation = await ModalLauncher.open(({ onClose, isShown }) => (
    <UnpublishedReferencesConfirm
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      unpublishedReferencesInfo={unpublishedReferencesInfo}
    />
  ));

  if (!confirmation) {
    throw new Error('Publication was terminated');
  }

  return confirmation;
};

export const registerUnpublishedReferencesWarning = publicationWarnings => ({ getData }) => {
  return publicationWarnings.register({
    group: 'unpublished_references',
    warnFn: unpublishedReferences => showConfirm(unpublishedReferences),
    getData,
    shouldShow: ({ references }) => references.length > 0
  });
};
