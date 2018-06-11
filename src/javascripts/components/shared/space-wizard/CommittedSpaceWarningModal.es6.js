import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'app/entity_editor/Components/Dialog';

import modalDialog from 'modalDialog';
import * as Intercom from 'intercom';

export default function CommittedSpaceWarningModal ({scope}) {
  const handleContact = Intercom.open;
  const handleCancel = scope.dialog.destroy.bind(scope.dialog);

  return (
    <Dialog testId="committed-space-change-warning">
      <Dialog.Header>This space cannot be changed</Dialog.Header>
      <Dialog.Body>
        <p>This space is part of your Enterprise deal and cannot be changed of deleted. Please, contact your customer success manager.</p>
      </Dialog.Body>
      <Dialog.Controls>
          <button
            onClick={handleContact}
            className="btn-action"
          >
            Talk to Support
          </button>
        <button
          className="btn-secondary-action"
          onClick={handleCancel}
        >Cancel</button>
      </Dialog.Controls>
    </Dialog>
  );
}

CommittedSpaceWarningModal.propTypes = {
  scope: PropTypes.object.isRequired
};

export function openModal () {
  return modalDialog.open({
    title: 'Create new space',
    template: '<react-component name="components/shared/space-wizard/CommittedSpaceWarningModal" class="modal-background"></react-component>',
    backgroundClose: true,
    persistOnNavigation: false,
    scopeData: {}
  });
}
