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
  getAllRoles,
  getSpaceMemberships,
  getAllSpaces
} from 'access_control/OrganizationMembershipRepository.es6';
import { map, flatten } from 'lodash';
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
    const roleIds = flatten(map(invitation.spaceInvitations, 'roleIds'));
    const [inviter, spaces, roles] = await Promise.all([
      getUser(endpoint, invitation.sys.inviter.sys.id),
      getAllSpaces(endpoint),
      getAllRoles(endpoint, { 'sys.id[in]': roleIds.join(',') })
    ]);

    invitation.sys.inviter = inviter;
    invitation.spaceInvitations = invitation.spaceInvitations.map(spaceInv => {
      spaceInv.roles = roles.filter(role => spaceInv.roleIds.includes(role.sys.id));

      const space = spaces.find(space => space.sys.id === spaceInv.sys.space.sys.id);

      if (space) {
        spaceInv.sys.space = space;
      }

      return spaceInv;
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

            let componentProps;

            if (invitation) {
              const {
                email,
                role,
                spaceInvitations,
                sys: { inviter, createdAt, id }
              } = invitation;
              componentProps = {
                email,
                role,
                spaceInvitations,
                inviter,
                invitedAt: createdAt,
                id,
                type: 'invitation'
              };
            } else if (membership) {
              const {
                user: { email },
                role,
                spaceMemberships,
                sys: { createdBy, createdAt, id }
              } = membership;
              componentProps = {
                email,
                role,
                spaceInvitations: spaceMemberships,
                inviter: createdBy,
                invitedAt: createdAt,
                id,
                type: 'invitation'
              };
            }

            return <UserInvitationDetail orgId={orgId} {...componentProps} />;
          }}
        </InvitationDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
