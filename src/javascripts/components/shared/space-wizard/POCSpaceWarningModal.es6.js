import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'app/entity_editor/Components/Dialog';

import modalDialog from 'modalDialog';
import * as Intercom from 'intercom';
import { supportUrl } from 'Config';

export default class POCSpaceWarningModal extends React.Component {
  static propTypes = {
    scope: PropTypes.object.isRequired
  };

  closeModal = this.props.scope.dialog.destroy.bind(this.props.scope.dialog);
  handleContact = () => {
    if (Intercom.isEnabled() && Intercom.isLoaded()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
    this.closeModal();
  };

  render () {
    return (
      <Dialog testId="committed-space-change-warning" size="small">
        <Dialog.Header>Upgrade space</Dialog.Header>
        <Dialog.Body>
          <p>{`It seems like you're ready to launch a proof of concept space. Talk to us to make that happen as soon as possible.`}</p>
        </Dialog.Body>
        <Dialog.Controls>
            <button
              onClick={this.handleContact}
              className="btn-action"
            >
              Talk to us
            </button>
          <button
            className="btn-secondary-action"
            onClick={this.closeModal}
          >Cancel</button>
        </Dialog.Controls>
      </Dialog>
    );
  }
}

export function openModal () {
  return modalDialog.open({
    title: 'Create new space',
    template: '<react-component name="components/shared/space-wizard/POCSpaceWarningModal" class="modal-background" props="modalProps"></react-component>',
    backgroundClose: true,
    persistOnNavigation: false,
    scopeData: {}
  });
}
