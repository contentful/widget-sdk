import React from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm } from '@contentful/forma-36-react-components';

export default class ChangeOwnRoleConfirmation extends React.Component {
  static propTypes = {
    oldRole: PropTypes.string.isRequired,
    newRole: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.bool.isRequired
  };

  render() {
    const { onClose, isShown, oldRole, newRole } = this.props;
    return (
      <ModalConfirm
        title="Change role in the organization"
        intent="negative"
        isShown={isShown}
        confirmLabel="Change"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <p>
          You are changing your own role from {oldRole} to {newRole}.
        </p>
        <p>Are you sure you want to proceed?</p>
      </ModalConfirm>
    );
  }
}
