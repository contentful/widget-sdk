import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, TextField, Button, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { isEmpty, get, some } from 'lodash';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { updateTeam } from '../services/TeamRepo';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';

const styles = {
  form: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  modalContent: css({
    marginBottom: tokens.spacingL,
  }),
};

TeamDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  updateTeamDetailsValues: PropTypes.func.isRequired,
  initialTeam: TeamPropType,
  allTeams: PropTypes.arrayOf(TeamPropType),
};

export function TeamDialog({ onClose, isShown, updateTeamDetailsValues, initialTeam, allTeams }) {
  const [validationMessage, setValidationMessage] = useState(null);
  const [teamName, setTeamName] = useState(initialTeam.name);
  const [teamDescription, setTeamDescription] = useState(initialTeam.description);

  const updateTeamDetails = async () => {
    const endpoint = createOrganizationEndpoint(initialTeam.sys.organization.sys.id);
    await updateTeam(endpoint, {
      name: teamName,
      description: teamDescription,
      sys: initialTeam.sys,
    });
    updateTeamDetailsValues({ name: teamName, description: teamDescription });
    onClose();
  };

  const handleChange = (field) => (evt) => {
    field === 'name' ? setTeamName(evt.target.value) : setTeamDescription(evt.target.value);
    setValidationMessage('');
  };

  const getValidationMessage = () => {
    if (isEmpty(teamName.trim())) {
      return 'Choose a name for your new team';
    }
    if (
      some(
        allTeams,
        (otherTeam) =>
          otherTeam.name === teamName.trim() && get(initialTeam, 'sys.id') !== otherTeam.sys.id
      )
    ) {
      return 'This name is already in use';
    }
    return null;
  };

  const onConfirm = (e) => {
    e.preventDefault();
    // Don't trim the content of inputs, it leads to irritating behaviour
    // specifically, if the user deletes characters and it's spaces the spaces will disappear
    const name = teamName.trim();
    const description = teamDescription.trim();

    const validationMessage = getValidationMessage();
    if (validationMessage) {
      setValidationMessage(validationMessage);
      return;
    }

    updateTeamDetails(initialTeam.sys.id, { name, description });
    onClose();
  };

  return (
    <Modal isShown={isShown} onClose={onClose} testId="team-edit-dialog">
      {() => (
        <form noValidate onSubmit={onConfirm} className={styles.form} data-test-id="team-form">
          <Modal.Header title={'Edit team'} onClose={onClose} />

          <Modal.Content>
            <Paragraph className={styles.modalContent}>
              Teams make it easy to group people together.
            </Paragraph>
            <TextField
              required
              name="teamName"
              id="team_name"
              testId="team-name-input"
              labelText="Team name"
              value={teamName}
              countCharacters
              textInputProps={{
                placeholder: 'The Mighty Ducks',
                maxLength: 120,
                autoFocus: true,
              }}
              validationMessage={validationMessage}
              onChange={handleChange('name')}
            />
            <TextField
              name="teamDescription"
              id="team_description"
              testId="team-name-description"
              textarea
              labelText="Team description"
              value={teamDescription}
              countCharacters
              textInputProps={{
                placeholder: `A crew of misfit kids from Minnesota that stick together against all odds to turn their ragtag youth hockey team into regional champions.`,
                maxLength: 800,
                rows: 4,
              }}
              onChange={handleChange('description')}
            />
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="primary" type="submit" testId="save-team-button">
              Save
            </Button>
            <Button
              type="button"
              onClick={onClose}
              buttonType="muted"
              testId="close-team-dialog-button">
              Cancel
            </Button>
          </Modal.Controls>
        </form>
      )}
    </Modal>
  );
}
