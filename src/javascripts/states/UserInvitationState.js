import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { createEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { Notification } from '@contentful/forma-36-react-components';
import { getUser, getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { get } from 'lodash';
import _ from 'lodash';
import { UserInvitation } from 'features/user-invitations';
import { LoadingState } from 'features/loading-state';

function UserInvitationState(props) {
  const { invitationId } = props;
  const [invitation, setInvitation] = useState();
  const [user, setUser] = useState();
  const [errored, setErrored] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const endpoint = createEndpoint();

    endpoint({
      method: 'GET',
      path: ['invitations', invitationId],
    })
      .then(setInvitation)
      .catch(() => setErrored(true));
  }, [invitationId]);

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setErrored(true));
  }, []);

  useEffect(() => {
    if (!invitation) return;

    async function checkInvitationStatus() {
      if (invitation.status !== 'accepted') return;

      const orgId = get(invitation, 'sys.organization.sys.id');
      const org = await getOrganization(orgId);
      const orgOwnerOrAdmin = isOwnerOrAdmin(org);
      go({
        path: ['home'],
        params: { orgId: orgId, orgOwnerOrAdmin: orgOwnerOrAdmin },
      }).then(() => {
        Notification.success(`You’ve already accepted this invitation!`);
      });
    }

    checkInvitationStatus();

    // check whether the invitation has already expired
    if (moment().isAfter(invitation.sys.expiresAt)) {
      setExpired(true);
    }
  }, [invitation]);

  if (!errored && (!user || !invitation)) {
    return <LoadingState />;
  }

  return <UserInvitation invitation={invitation} user={user} expired={expired} errored={errored} />;
}

UserInvitationState.propTypes = {
  invitationId: PropTypes.string.isRequired,
};

export default {
  name: 'invitations',
  url: '/invitations/:invitationId',
  component: UserInvitationState,
};
