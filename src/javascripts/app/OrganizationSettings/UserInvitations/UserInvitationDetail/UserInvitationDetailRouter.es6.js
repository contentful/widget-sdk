import React from 'react';
import PropTypes from 'prop-types';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  getMembership,
  getInvitation,
  getUser,
  getRoles,
  getSpaceMemberships
} from 'access_control/OrganizationMembershipRepository.es6';
import { get, flatten } from 'lodash';
import ResolveLinks from 'app/OrganizationSettings/LinkResolver.es6';

import UserInvitationDetail from './UserInvitationDetail.es6';

const InvitationDetailFetcher = createFetcherComponent(async ({ orgId, invitationId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  let invitation;
  let membership;

  try {
    invitation = await getInvitation(endpoint, invitationId);
  } catch (e) {
    membership = await getMembership(endpoint, invitationId);
  }

  if (invitation) {
    const roleIds = flatten(invitation.spaceInvitations.map(i => get(i, 'roleIds')));
    const includePaths = ['sys.space'];
    const [inviter, roles] = await Promise.all([
      getUser(endpoint, invitation.sys.inviter.sys.id),
      getRoles(endpoint, { include: includePaths.join(','), 'sys.id[in]': roleIds.join(',') }).then(
        ({ items, includes }) => ResolveLinks({ paths: includePaths, items, includes })
      )
    ]);

    invitation.sys.inviter = inviter;
    invitation.spaceInvitations = invitation.spaceInvitations.map(space => {
      space.roles = roles.filter(role => space.roleIds.includes(role.sys.id));

      return space;
    });
  } else if (membership) {
    const includePaths = ['roles', 'sys.space'];
    const [user, createdBy, spaceMemberships] = await Promise.all([
      getUser(endpoint, membership.user.sys.id),
      getUser(endpoint, membership.sys.createdBy.sys.id),
      getSpaceMemberships(endpoint, {
        'sys.user.sys.id': membership.user.sys.id,
        include: includePaths.join(',')
      }).then(({ items, includes }) => ResolveLinks({ paths: includePaths, items, includes }))
    ]);

    membership.user = user;
    membership.spaceMemberships = spaceMemberships;
    membership.sys.createdBy = createdBy;
  }

  return [invitation, membership];
});

export default class UserInvitationsListRouter extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    invitationId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, invitationId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <InvitationDetailFetcher orgId={orgId} invitationId={invitationId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading user invitation..." />;
            }

            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            const [invitation, membership] = data;

            let email;
            let role;
            let spaceInvitations;
            let inviter;

            if (invitation) {
              email = invitation.email;
              role = invitation.role;
              spaceInvitations = invitation.spaceInvitations;
              inviter = invitation.sys.inviter;
            } else if (membership) {
              email = membership.user.email;
              role = membership.role;
              spaceInvitations = membership.spaceInvitations;
              inviter = membership.sys.createdBy;
            }

            return (
              <UserInvitationDetail
                email={email}
                role={role}
                spaceInvitations={spaceInvitations}
                inviter={inviter}
              />
            );
          }}
        </InvitationDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
