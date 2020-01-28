import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { User, Space } from 'app/OrganizationSettings/PropTypes';
import {
  Button,
  Modal,
  FormLabel,
  Notification,
  Note
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { getFullNameOrEmail } from '../UserUtils';
import { joinAndTruncate } from 'utils/StringUtils';
import AddToSpaces from './AddToSpaces';

import { create } from 'access_control/SpaceMembershipRepository';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { css } from 'emotion';
import { createImmerReducer } from 'redux/utils/createImmerReducer';

const styles = {
  errorMessage: css({
    marginBottom: tokens.spacingM
  })
};

const reducer = createImmerReducer({
  SPACE_MEMBERSHIPS_CHANGED: (state, action) => {
    state.spaceMemberships = action.payload;
    state.submitted = false;
  },
  VALIDATION_STATUS_CHANGED: (state, action) => {
    state.isInvalid = action.payload;
  },
  FORM_SUBMITTED: state => {
    state.isSubmitted = true;
  },
  REQUEST_SENT: state => {
    state.inProgress = true;
  }
});

export default function AddToSpacesModal({
  user,
  orgId,
  currentSpaces,
  isShown,
  onClose,
  onAddedToSpaces
}) {
  // const [spaceMemberships, setSpaceMemberships] = useState([]);
  // const [isSubmitted, setSubmitted] = useState(false);
  // const [isInvalid, setInvalid] = useState(false);

  const [{ spaceMemberships, isSubmitted, isInvalid, inProgress }, dispatch] = useReducer(reducer, {
    spaceMemberships: [],
    isSubmitted: false,
    isInvalid: false,
    inProgress: false
  });

  // const [{ isLoading, data }, addFn] = useAddUserToSpaces(user);

  const handleChange = useCallback(data => {
    dispatch({ type: 'SPACE_MEMBERSHIPS_CHANGED', payload: data });
  }, []);

  const handleSubmit = async () => {
    const isMissingRoles = spaceMemberships.some(membership => membership.roles.length === 0);
    dispatch({ type: 'FORM_SUBMITTED' });
    dispatch({ type: 'VALIDATION_MESSAGE_CHANGED', payload: isMissingRoles });

    if (isMissingRoles) return;

    dispatch({ type: 'REQUEST_SENT' });
    const { fulfilled, rejected } = await addUserToSpaces(user, spaceMemberships);

    if (fulfilled.length > 0) {
      const newSpaceMemberships = fulfilled.map(({ membership }) => membership);
      const newSpaces = fulfilled.map(({ space }) => space);
      Notification.success(buildSuccessMessage(user, newSpaces));
      onAddedToSpaces(newSpaceMemberships);
    }

    if (rejected.length > 0) {
      Notification.error(buildErrorMessage(user, rejected));
    }

    onClose(true);
  };

  return (
    <Modal
      title={`Add ${getFullNameOrEmail(user)} to one or more spaces`}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={!inProgress}
      shouldCloseOnOverlayClick={!inProgress}
      size="large">
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
  user: User.isRequired,
  orgId: PropTypes.string.isRequired,
  currentSpaces: PropTypes.arrayOf(Space).isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddedToSpaces: PropTypes.func.isRequired
};

function buildSuccessMessage(user, spaces) {
  const spaceNames = spaces.map(space => space.name);
  const userName = getFullNameOrEmail(user);
  return `You've added ${userName} to ${joinAndTruncate(spaceNames, 2, 'spaces')}.`;
}

function buildErrorMessage(user, results) {
  const spaceNames = results.map(({ space }) => space.name);
  const userName = getFullNameOrEmail(user);
  return `${userName} is already member of ${joinAndTruncate(spaceNames, 2, 'spaces')}.`;
}

async function addUserToSpaces(user, memberships) {
  const fulfilled = [];
  const rejected = [];

  const promises = memberships.map(async ({ space, roles }) => {
    const endpoint = createSpaceEndpoint(space.sys.id);
    const repo = create(endpoint);

    try {
      const membership = await repo.invite(user.email, roles);
      fulfilled.push({ space, membership });
    } catch (error) {
      rejected.push({ space, error });
    }
  });

  await Promise.all(promises);

  return { fulfilled, rejected };
}
