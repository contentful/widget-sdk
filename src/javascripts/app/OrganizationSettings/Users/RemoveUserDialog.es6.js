import React from 'react';
import PropTypes from 'prop-types';

import { User as UserPropType } from './PropTypes.es6';
import { ModalConfirm } from '@contentful/ui-component-library';

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
        <React.Fragment>
          <p>
            Are you sure you want to remove{' '}
            {user.firstName ? `${user.firstName} ${user.lastName}` : user.email} from the
            organization?
          </p>
        </React.Fragment>
      </ModalConfirm>
    );
  }
}
