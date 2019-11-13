import React from 'react';
import PropTypes from 'prop-types';

import { User as UserPropType } from 'app/OrganizationSettings/PropTypes';
import { ModalConfirm } from '@contentful/forma-36-react-components';

export default class RemoveUserDialog extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  render() {
    const { user, isShown, onClose } = this.props;

    return (
      <ModalConfirm
        title="Remove user from the organization"
        intent="negative"
        isShown={isShown}
        confirmLabel="Remove"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <p>
          Are you sure you want to remove{' '}
          {user.firstName ? `${user.firstName} ${user.lastName}` : user.email} from the
          organization?
        </p>
      </ModalConfirm>
    );
  }
}
