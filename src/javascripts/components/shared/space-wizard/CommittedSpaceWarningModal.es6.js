import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'app/entity_editor/Components/Dialog';

import modalDialog from 'modalDialog';
import * as Intercom from 'intercom';
import { supportUrl } from 'Config';

export default function CommittedSpaceWarningModal ({scope}) {
  const closeModal = scope.dialog.destroy.bind(scope.dialog);
  const handleContact = () => {
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }

    closeModal();
  };

  return (
    <Dialog testId="committed-space-change-warning" size="small">
      <Dialog.Header>Contact customer success to make this change</Dialog.Header>
      <Dialog.Body>
        <p>This space is part of your Enterprise plan with Contentful. To make any changes, please contact your customer success manager.</p>
      </Dialog.Body>
      <Dialog.Controls>
          <button
            onClick={handleContact}
            className="btn-action"
          >
            Talk to us
          </button>
        <button
          className="btn-secondary-action"
          onClick={closeModal}
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
    template: '<react-component name="components/shared/space-wizard/CommittedSpaceWarningModal" class="modal-background" props="modalProps"></react-component>',
    backgroundClose: true,
    persistOnNavigation: false,
    scopeData: {}
  });
}
