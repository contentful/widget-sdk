import React, { useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';

import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository';
import { fetchAndResolve } from 'data/LinkResolver';
import { useAsync } from 'core/hooks';

import UserSelection from './UserSelection';
import { Modal, Notification } from '@contentful/forma-36-react-components';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import RoleSelection from './RoleSelection';
import RoleRepository from 'access_control/RoleRepository';
import { track } from 'analytics/Analytics';
import AddUsersError from './AddUsersError';
import { isTaken } from 'utils/ServerErrorUtils';
import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { getSpaceId, getEnvironmentId } from 'core/services/SpaceEnvContext/utils';

const steps = {
  USERS: 1,
  ROLES: 2,
  ERROR: 3,
};

const initialState = {
  selectedUsers: [],
  selectedRoles: {},
  rejected: [],
  currentStep: steps.USERS,
};

const reducer = createImmerReducer({
  USER_ADDED: (state, action) => {
    state.selectedUsers.push(action.payload);
  },
  USER_REMOVED: (state, action) => {
    state.selectedUsers = state.selectedUsers.filter(
      (user) => user.sys.id !== action.payload.sys.id
    );
  },
  STEP_CHANGED: (state, action) => {
    state.currentStep = action.payload;
  },
  USER_ROLES_CHANGED: (state, action) => {
    const { orgMembershipId, roles } = action.payload;
    state.selectedRoles[orgMembershipId] = roles;
  },
  INVITATIONS_FAILED: (state, action) => {
    state.rejected = action.payload;
    state.currentStep = steps.ERROR;
  },
  RETRY: (state) => {
    state.selectedUsers = state.rejected;
    state.rejected = [];
    state.currentStep = steps.ROLES;
  },
});

export default function AddUsers({ unavailableUserIds, orgId, isShown, onClose, space }) {
  const [{ selectedUsers, selectedRoles, rejected, currentStep }, dispatch] = useReducer(
    reducer,
    initialState
  );
  const { data: availableUsers } = useFetchAvailableOrgMemberships(orgId, unavailableUserIds);
  const { data: spaceRoles } = useFetchSpaceRoles(space);
  const spaceId = getSpaceId(space);
  const environmentId = getEnvironmentId(space);

  const handleSubmit = async () => {
    const { rejected } = await inviteUsers(selectedUsers, selectedRoles, spaceId, environmentId);

    if (rejected.length > 0) {
      dispatch({ type: 'INVITATIONS_FAILED', payload: rejected });
    } else {
      Notification.success('Invitations successfully sent.');
      onClose(true);
    }
  };

  return (
    <Modal
      title={`Add users to space`}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      size="large"
      testId="add-users">
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          {currentStep === steps.USERS && (
            <UserSelection
              selectedUsers={selectedUsers}
              availableUsers={availableUsers}
              onUserSelected={(user) => dispatch({ type: 'USER_ADDED', payload: user })}
              onUserRemoved={(user) => dispatch({ type: 'USER_REMOVED', payload: user })}
              onConfirm={() => dispatch({ type: 'STEP_CHANGED', payload: steps.ROLES })}
              onClose={onClose}
            />
          )}
          {currentStep === steps.ROLES && (
            <RoleSelection
              selectedUsers={selectedUsers}
              selectedRoles={selectedRoles}
              spaceRoles={spaceRoles}
              onChange={(orgMembershipId, roles) =>
                dispatch({ type: 'USER_ROLES_CHANGED', payload: { orgMembershipId, roles } })
              }
              onBack={() => dispatch({ type: 'STEP_CHANGED', payload: steps.USERS })}
              onClose={onClose}
              onConfirm={handleSubmit}
            />
          )}
          {currentStep === steps.ERROR && (
            <AddUsersError
              rejected={rejected}
              onRetry={() => dispatch({ type: 'RETRY' })}
              onClose={onClose}
            />
          )}
        </>
      )}
    </Modal>
  );
}

AddUsers.propTypes = {
  onClose: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  orgId: PropTypes.string.isRequired,
  unavailableUserIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  space: PropTypes.object.isRequired,
};

function useFetchAvailableOrgMemberships(orgId, unavailableUserIds) {
  const fetchAvailableOrgMemberships = useCallback(async () => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    // fetch all org memberships
    const includePaths = ['sys.user'];
    const promise = getAllMembershipsWithQuery(orgEndpoint, {
      order: ['sys.user.firstName', 'sys.user.email'],
      include: includePaths,
    });

    const allOrgMemberships = await fetchAndResolve(promise, includePaths);
    // get all memberships where the user is not already a member of the space
    return allOrgMemberships.filter(
      (membership) => !unavailableUserIds.includes(membership.sys.user.sys.id)
    );
  }, [orgId, unavailableUserIds]);

  return useAsync(fetchAvailableOrgMemberships);
}

function useFetchSpaceRoles(space) {
  const fetchSpaceRoles = useCallback(async () => {
    return RoleRepository.getInstance(space).getAll();
  }, [space]);

  return useAsync(fetchSpaceRoles);
}

async function inviteUsers(selectedUsers, selectedRoles, spaceId, environmentId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const membershipsRepo = createMembershipRepo(spaceEndpoint);
  const fulfilled = [];
  const rejected = [];

  const promises = selectedUsers.map(async (orgMembership) => {
    const email = orgMembership.sys.user.email;
    const roleIds = selectedRoles[orgMembership.sys.id];
    try {
      await membershipsRepo.invite(email, roleIds);
      fulfilled.push(orgMembership);
    } catch (error) {
      rejected.push({ orgMembership, error });
    }
  });

  await Promise.all(promises);

  track('teams_in_space:users_added', {
    numErr: rejected.length,
    numSuccess: fulfilled.length,
  });

  // get all unexpected rejections (not rejected because user is already member of the space)
  const rejectedUnexpectedly = rejected
    .filter(({ error }) => !isTaken(error))
    .map(({ orgMembership }) => orgMembership);

  return { fulfilled, rejected: rejectedUnexpectedly };
}
