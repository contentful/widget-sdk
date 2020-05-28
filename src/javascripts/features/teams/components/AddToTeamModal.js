import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Team as TeamPropTypes } from 'app/OrganizationSettings/PropTypes';
import { Button, Modal, FormLabel, Notification } from '@contentful/forma-36-react-components';
import { AddToTeam } from './AddToTeam';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createTeamMembership } from '../services/TeamRepository';
import { createImmerReducer } from 'core/utils/createImmerReducer';

const userToString = ({ firstName, lastName, email }) =>
  firstName ? `${firstName} ${lastName}` : email;

const reducer = createImmerReducer({
  TEAM_MEMBERSHIP_ADDED: (state) => {
    state.inProgress = false;
  },
  TEAM_MEMBERSHIPS_CHANGED: (state, action) => {
    state.orgMembership = action.payload;
  },
  REQUEST_SENT: (state) => {
    state.inProgress = true;
  },
});

export function AddToTeamModal({
  team,
  orgId,
  currentTeamMembers,
  isShown,
  onClose,
  onAddedToTeam,
}) {
  const [{ orgMembership, inProgress }, dispatch] = useReducer(reducer, {
    orgMembership: null,
    inProgress: false,
  });

  const handleChange = useCallback((data) => {
    dispatch({ type: 'TEAM_MEMBERSHIPS_CHANGED', payload: data });
  }, []);

  const handleSubmit = async () => {
    dispatch({ type: 'REQUEST_SENT' });
    const orgEndpoint = createOrganizationEndpoint(orgId);
    try {
      const teamMembership = await createTeamMembership(
        orgEndpoint,
        team.sys.id,
        orgMembership.sys.id
      );
      dispatch({ type: 'TEAM_MEMBERSHIP_ADDED', payload: teamMembership });
      Notification.success(
        `Successfully added ${userToString(orgMembership.sys.user)} to team ${team.name}`
      );
      onAddedToTeam();
    } catch (e) {
      Notification.error(
        `Could not add ${userToString(orgMembership.sys.user)} to team ${team.name}`
      );
    }

    onClose(true);
  };

  return (
    <Modal
      title={`Add user to team ${team.name}`}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={!inProgress}
      shouldCloseOnOverlayClick={!inProgress}
      size="large"
      testId="add-to-teams-modal">
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <FormLabel htmlFor="teams">Select user</FormLabel>
            <AddToTeam
              orgId={orgId}
              onChange={handleChange}
              currentTeamMembers={currentTeamMembers}
            />
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="positive"
              onClick={handleSubmit}
              loading={inProgress}
              testId="add-to-team.modal.submit-button">
              Add to team
            </Button>
            <Button
              buttonType="muted"
              disabled={inProgress}
              onClick={() => onClose(true)}
              testId="add-to-team.modal.cancel-button">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AddToTeamModal.propTypes = {
  team: TeamPropTypes.isRequired,
  orgId: PropTypes.string.isRequired,
  currentTeamMembers: PropTypes.arrayOf(PropTypes.string).isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddedToTeam: PropTypes.func.isRequired,
};
