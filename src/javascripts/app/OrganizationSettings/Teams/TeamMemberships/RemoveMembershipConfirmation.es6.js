import React from 'react';
import PropTypes from 'prop-types';

import { User as UserPropType, Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { ModalConfirm } from '@contentful/forma-36-react-components';

export default class RemoveMembershipConfirmation extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    team: TeamPropType.isRequired,
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  render() {
    const { user, team, isShown, onClose } = this.props;

    return (
      <ModalConfirm
        title={`Remove user from team ${team.name}`}
        intent="negative"
        isShown={isShown}
        confirmLabel="Remove"
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <p>
          Are you sure you want to remove{' '}
          {user.firstName ? `${user.firstName} ${user.lastName}` : user.email} from team {team.name}
          ?
        </p>
      </ModalConfirm>
    );
  }
}
