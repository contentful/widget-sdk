import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'app/entity_editor/Components/Dialog';

export default class ConfirmationDialog extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    body: PropTypes.node.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  confirm = () => {
    this.props.onConfirm();
  };

  cancel = () => {
    this.props.onCancel();
  };

  render() {
    const { title, body } = this.props;
    return (
      <Dialog testId="confirmation-dialog" size="small">
        {title && <Dialog.Header>{title}</Dialog.Header>}
        <Dialog.Body>{body}</Dialog.Body>
        <Dialog.Controls>
          <button
            className="confirmation-dialog__confirm btn-action"
            data-test-id="confirmation-dialog-confirm"
            onClick={this.confirm}>
            Confirm
          </button>
          <button
            data-test-id="confirmation-dialog-cancel"
            className="confirmation-dialog__cancel btn-secondary-action"
            onClick={this.cancel}>
            Cancel
          </button>
        </Dialog.Controls>
      </Dialog>
    );
  }
}
