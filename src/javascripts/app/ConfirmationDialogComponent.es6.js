import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'app/entity_editor/Components/Dialog';

export default class ConfirmationDialog extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    message: PropTypes.node.isRequired,
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
    const { title, message } = this.props;
    return (
      <Dialog testId="confirmation-dialog" size="small">
        {title && <Dialog.Header>{title}</Dialog.Header>}
        <Dialog.Body>
          <p>{message}</p>
        </Dialog.Body>
        <Dialog.Controls>
          <button onClick={this.confirm} className="btn-action">
            Confirm
          </button>
          <button className="btn-secondary-action" onClick={this.cancel}>
            Cancel
          </button>
        </Dialog.Controls>
      </Dialog>
    );
  }
}
