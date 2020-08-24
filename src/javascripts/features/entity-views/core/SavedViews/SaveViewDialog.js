import React from 'react';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { SaveViewDialogComponent } from './SaveViewDialogComponent';

export function SaveViewDialog({ allowViewTypeSelection = false, allowRoleAssignment = false }) {
  const uniqueModalKey = `save-view` + Date.now();
  return ModalLauncher.open(({ isShown, onClose }) => (
    <SaveViewDialogComponent
      allowViewTypeSelection={allowViewTypeSelection}
      allowRoleAssignment={!!allowRoleAssignment}
      onConfirm={({ title, isShared }) => onClose({ title, isShared })}
      onCancel={() => onClose(false)}
      isShown={isShown}
      key={uniqueModalKey}
    />
  ));
}