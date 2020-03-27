import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { User, Space } from 'app/OrganizationSettings/PropTypes';
import { Button, Modal, FormLabel, Notification } from '@contentful/forma-36-react-components';

import { getFullNameOrEmail } from '../UserUtils';
import { joinAndTruncate } from 'utils/StringUtils';
import AddToTeams from './AddToTeams';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createTeamMembership } from 'access_control/TeamRepository';
import { createImmerReducer } from 'redux/utils/createImmerReducer';

const reducer = createImmerReducer({
  TEAMS_CHANGED: (state, action) => {
    state.teams = action.payload;
    state.submitted = false;
  },
  VALIDATION_STATUS_CHANGED: (state, action) => {
    state.isInvalid = action.payload;
  },
  FORM_SUBMITTED: (state) => {
    state.isSubmitted = true;
  },
  REQUEST_SENT: (state) => {
    state.inProgress = true;
  },
});

export default function AddToTeamsModal({
  user,
  orgId,
  orgMembershipId,
  currentTeams,
  isShown,
  onClose,
  onAddedToTeams,
}) {
  const [{ teams, isSubmitted, inProgress }, dispatch] = useReducer(reducer, {
    teams: [],
    isSubmitted: false,
    isInvalid: false,
    inProgress: false,
  });
  const handleChange = useCallback((data) => {
    dispatch({ type: 'TEAMS_CHANGED', payload: data });
  }, []);

  const handleSubmit = async () => {
    dispatch({ type: 'FORM_SUBMITTED' });
    dispatch({ type: 'REQUEST_SENT' });
    const { fulfilled, rejected } = await addUserToTeam(orgId, orgMembershipId, teams);

    if (fulfilled.length > 0) {
      const newTeamMemberships = fulfilled.map(({ membership }) => membership);
      const newTeams = fulfilled.map(({ team }) => team);
      Notification.success(buildSuccessMessage(user, newTeams));
      onAddedToTeams(newTeamMemberships);
    }

    if (rejected.length > 0) {
      Notification.error(buildErrorMessage(user, rejected));
    }

    onClose(true);
  };

  return (
    <Modal
      title={`Add ${getFullNameOrEmail(user)} to one or more teams`}
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
            <div>
              <FormLabel htmlFor="teams">Select teams</FormLabel>
              <AddToTeams
                orgId={orgId}
                ignoredTeams={currentTeams}
                onChange={handleChange}
                submitted={isSubmitted}
                inputWidth="full"
              />
            </div>
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="positive"
              onClick={handleSubmit}
              loading={inProgress}
              testId="add-to-teams.modal.submit-button">
              Add to selected teams
            </Button>
            <Button
              buttonType="muted"
              disabled={inProgress}
              onClick={() => onClose(true)}
              testId="add-to-teams.modal.cancel-button">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AddToTeamsModal.propTypes = {
  user: User.isRequired,
  orgId: PropTypes.string.isRequired,
  orgMembershipId: PropTypes.string.isRequired,
  currentTeams: PropTypes.arrayOf(Space).isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddedToTeams: PropTypes.func.isRequired,
};

function buildSuccessMessage(user, teams) {
  const teamNames = teams.map((team) => team.name);
  const userName = getFullNameOrEmail(user);
  return `You've added ${userName} to ${joinAndTruncate(teamNames, 2, 'teams')}.`;
}

function buildErrorMessage(user, results) {
  const teamNames = results.map(({ team }) => team.name);
  const userName = getFullNameOrEmail(user);
  return `${userName} is already member of ${joinAndTruncate(teamNames, 2, 'teams')}.`;
}

async function addUserToTeam(orgId, orgMembershipId, teams) {
  const fulfilled = [];
  const rejected = [];

  const promises = teams.map(async (team) => {
    const endpoint = createOrganizationEndpoint(orgId);

    try {
      const membership = await createTeamMembership(endpoint, orgMembershipId, team.sys.id);
      fulfilled.push({ team, membership });
    } catch (error) {
      rejected.push({ team, error });
    }
  });

  await Promise.all(promises);

  return { fulfilled, rejected };
}
