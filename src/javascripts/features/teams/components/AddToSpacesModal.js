import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import { Team as TeamPropTypes, Space as SpacePropTypes } from 'app/OrganizationSettings/PropTypes';
import {
  Button,
  Modal,
  FormLabel,
  Notification,
  Note,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { joinAndTruncate } from 'utils/StringUtils';
import { AddToSpaces } from './AddToSpaces';

import { createTeamSpaceMembership } from '../services/TeamRepository';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { css } from 'emotion';
import { createImmerReducer } from 'core/utils/createImmerReducer';

const styles = {
  errorMessage: css({
    marginBottom: tokens.spacingM,
  }),
};

const reducer = createImmerReducer({
  SPACE_MEMBERSHIPS_CHANGED: (state, action) => {
    state.spaceMemberships = action.payload;
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

export function AddToSpacesModal({
  team,
  orgId,
  currentSpaces,
  isShown,
  onClose,
  onAddedToSpaces,
}) {
  const [{ spaceMemberships, isSubmitted, isInvalid, inProgress }, dispatch] = useReducer(reducer, {
    spaceMemberships: [],
    isSubmitted: false,
    isInvalid: false,
    inProgress: false,
  });
  const handleChange = useCallback((data) => {
    dispatch({ type: 'SPACE_MEMBERSHIPS_CHANGED', payload: data });
  }, []);

  const handleSubmit = async () => {
    const isMissingRoles = spaceMemberships.some((membership) => membership.roles.length === 0);
    dispatch({ type: 'FORM_SUBMITTED' });
    dispatch({ type: 'VALIDATION_MESSAGE_CHANGED', payload: isMissingRoles });

    if (isMissingRoles) return;

    dispatch({ type: 'REQUEST_SENT' });
    try {
      await addTeamToSpaces(team, spaceMemberships);
      const newSpaces = spaceMemberships.map(({ space }) => space);
      Notification.success(buildSuccessMessage(team, newSpaces));
      onAddedToSpaces();
    } catch (e) {
      Notification.error(buildErrorMessage(team, e));
    }

    onClose(true);
  };

  return (
    <Modal
      title={`Add ${team.name} to one or more spaces`}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={!inProgress}
      shouldCloseOnOverlayClick={!inProgress}
      size="large"
      testId="add-to-spaces-modal">
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            {isInvalid && (
              <Note className={styles.errorMessage} noteType="negative">
                Select space roles
              </Note>
            )}
            <div>
              <FormLabel htmlFor="spaces">Select spaces</FormLabel>
              <AddToSpaces
                orgId={orgId}
                ignoredSpaces={currentSpaces}
                onChange={handleChange}
                submitted={isSubmitted}
              />
            </div>
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="positive"
              onClick={handleSubmit}
              loading={inProgress}
              testId="add-to-spaces.modal.submit-button">
              Add to selected spaces
            </Button>
            <Button
              buttonType="muted"
              disabled={inProgress}
              onClick={() => onClose(true)}
              testId="add-to-spaces.modal.cancel-button">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AddToSpacesModal.propTypes = {
  team: TeamPropTypes.isRequired,
  orgId: PropTypes.string.isRequired,
  currentSpaces: PropTypes.arrayOf(SpacePropTypes).isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddedToSpaces: PropTypes.func.isRequired,
};

function buildSuccessMessage(team, spaces) {
  const spaceNames = spaces.map((space) => space.name);
  return `You've added ${team.name} to ${joinAndTruncate(spaceNames, 2, 'spaces')}.`;
}

function buildErrorMessage(team, results) {
  const spaceNames = results.map(({ space }) => space.name);
  return `${team.name} is already member of ${joinAndTruncate(spaceNames, 2, 'spaces')}.`;
}

async function addTeamToSpaces(team, memberships) {
  const promises = memberships.map(async ({ space, roles }) => {
    const endpoint = createSpaceEndpoint(space.sys.id);
    const data = {
      admin: roles[0] === ADMIN_ROLE_ID,
      roles: roles.map((id) => ({
        sys: { id, type: 'Link', linkType: 'Role' },
      })),
    };
    return createTeamSpaceMembership(endpoint, team.sys.id, data);
  });

  return Promise.all(promises);
}
