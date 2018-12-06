import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getValue } from 'utils/kefir.es6';
import Workbench from 'app/common/Workbench.es6';
import { go } from 'states/Navigator.es6';
import { Button, Notification } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import UserCard from '../UserCard.es6';
import { orgRoles } from './OrgRoles.es6';
import { getUserName } from '../UserUtils.es6';

import {
  SpaceMembership as SpaceMembershipPropType,
  OrganizationMembership as OrganizationMembershipPropType,
  Space as SpacePropType,
  SpaceRole as SpaceRolePropType,
  User as UserPropType
} from '../../PropTypes.es6';
import { OrganizationRoleSelector } from './OrganizationRoleSelector.es6';
import {
  removeMembership,
  updateMembership
} from 'access_control/OrganizationMembershipRepository.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UserSpaceMemberships from './UserSpaceMemberships/UserSpaceMemberships.es6';
import UserSsoInfo from './SSO/UserSsoInfo.es6';
import RemoveOrgMemberDialog from '../RemoveUserDialog.es6';
import ChangeOwnRoleConfirmation from './ChangeOwnRoleConfirmation.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserDetail extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      TokenStore: PropTypes.object,
      OrganizationRoles: PropTypes.object
    }),
    initialMembership: OrganizationMembershipPropType.isRequired,
    createdBy: UserPropType,
    spaceMemberships: PropTypes.arrayOf(SpaceMembershipPropType).isRequired,
    spaces: PropTypes.arrayOf(SpacePropType).isRequired,
    roles: PropTypes.arrayOf(SpaceRolePropType).isRequired,
    orgId: PropTypes.string.isRequired
  };

  state = {
    membership: this.props.initialMembership,
    // Only org owners can create other owners
    disableOwnerRole: false
  };

  currentUser = getValue(this.props.$services.TokenStore.user$);
  isSelf =
    this.currentUser && this.currentUser.sys.id === this.props.initialMembership.sys.user.sys.id;

  endpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const disableOwnerRole = await this.shouldDisableOwnerRole();
    this.setState({ disableOwnerRole });
  }

  async shouldDisableOwnerRole() {
    const { TokenStore, OrganizationRoles } = this.props.$services;
    const org = await TokenStore.getOrganization(this.props.orgId);
    return !OrganizationRoles.isOwner(org);
  }

  getLastActiveDate() {
    const dateString = this.state.membership.sys.lastActiveAt;

    return dateString ? moment(dateString, moment.ISO_8601).fromNow() : 'Not available';
  }

  getRoleDescription() {
    const { membership } = this.state;
    return orgRoles.find(role => role.value === membership.role).description;
  }

  toggleOrgRoleDropdown() {
    this.setState({ orgRoleDropdownIsOpen: !this.state.orgRoleDropdownIsOpen });
  }

  changeOrgRole = async role => {
    const oldMembership = this.state.membership;
    const {
      sys: { id, version }
    } = oldMembership;
    let updatedMembership;

    // role is not changing
    if (oldMembership.role === role) {
      return;
    }

    // user is changing their own role
    if (this.isSelf) {
      const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
        <ChangeOwnRoleConfirmation
          isShown={isShown}
          onClose={onClose}
          newRole={role}
          oldRole={oldMembership.role}
        />
      ));

      if (!confirmation) {
        return;
      }
    }

    try {
      updatedMembership = await updateMembership(this.endpoint, { id, role, version });
    } catch (e) {
      Notification.error(e.data.message);
      return;
    }

    this.setState({
      membership: {
        role,
        sys: {
          ...oldMembership.sys,
          sso: updatedMembership.sys.sso,
          version: updatedMembership.sys.version
        }
      }
    });
    Notification.success(`
      Role successfully changed to ${role}
    `);
  };

  async removeMembership() {
    const { id, user } = this.state.membership.sys;

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <RemoveOrgMemberDialog isShown={isShown} onClose={onClose} user={user} />
    ));

    if (!confirmation) {
      return;
    }

    try {
      await removeMembership(this.endpoint, id);
    } catch (e) {
      Notification.error(e.data.message);
      return;
    }

    this.goToUserList();

    const message = user.firstName
      ? `${user.firstName} has been successfully removed from this organization`
      : `Membership successfully removed`;

    Notification.success(message);
  }

  goToUserList() {
    go({
      path: ['account', 'organizations', 'users']
    });
  }

  render() {
    const { spaceMemberships, createdBy, spaces, roles, orgId } = this.props;
    const { membership, disableOwnerRole } = this.state;
    const { user } = membership.sys;
    const isPending = userObj => !userObj.firstName;

    return (
      <Workbench className="organization-users-page" testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Users</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="user-details">
            <div className="user-details__sidebar">
              <section className="user-details__profile-section">
                <UserCard user={membership.sys.user} size="large" />
              </section>
              <section className="user-details__profile-section">
                <dl className="definition-list">
                  {!isPending(user) && (
                    <React.Fragment>
                      <dt>Last activity</dt>
                      <dd>{this.getLastActiveDate()}</dd>
                    </React.Fragment>
                  )}
                  <dt>{isPending(user) ? 'Invited at' : 'Member since'}</dt>
                  <dd>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</dd>
                  <dt>Invited by</dt>
                  <dd>{getUserName(createdBy)}</dd>
                </dl>
              </section>
              {membership.sys.sso && (
                <section className="user-details__profile-section">
                  <UserSsoInfo membership={membership} />
                </section>
              )}
              <section className="user-details__profile-section">
                <dl className="definition-list">
                  <dt>Organization role</dt>
                  <dd>
                    <OrganizationRoleSelector
                      style={{ marginTop: '-5px' }}
                      isSelf={this.isSelf}
                      disableOwnerRole={disableOwnerRole}
                      initialRole={membership.role}
                      onChange={this.changeOrgRole}
                    />
                  </dd>
                </dl>
                <p style={{ marginTop: 10 }}>{this.getRoleDescription()}</p>
              </section>
              <Button buttonType="negative" size="small" onClick={() => this.removeMembership()}>
                Remove membership
              </Button>
            </div>
            <div className="user-details__content">
              <UserSpaceMemberships
                initialMemberships={spaceMemberships}
                user={user}
                currentUser={this.currentUser}
                spaces={spaces}
                roles={roles}
                orgId={orgId}
              />
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer(
  {
    from: 'services/TokenStore.es6',
    as: 'TokenStore'
  },
  {
    as: 'OrganizationRoles',
    from: 'services/OrganizationRoles.es6'
  }
)(UserDetail);
