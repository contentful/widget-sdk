import React from 'react';
import PropTypes from 'prop-types';

import { ModalConfirm } from '@contentful/forma-36-react-components';

export default class RemoveUserDialog extends React.Component {
  static propTypes = {
    email: PropTypes.string.isRequired,
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  render() {
    const { email, isShown, onClose } = this.props;

    return (
      <ModalConfirm
        title="Revoke invitation"
        intent="negative"
        size="small"
        isShown={isShown}
        confirmLabel="Revoke"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <p>Are you sure you want to revoke the invitation for {email}?</p>
      </ModalConfirm>
    );
  }
}
