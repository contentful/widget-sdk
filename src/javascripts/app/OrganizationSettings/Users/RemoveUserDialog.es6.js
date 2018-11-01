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
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <React.Fragment>
          <p>
            You are about to remove {user.firstName} {user.lastName} from your organization.
          </p>
          <p>
            After removal this user will not be able to access this organization in any way. Do you
            want to proceed?
          </p>
        </React.Fragment>
      </ModalConfirm>
    );
  }
}
