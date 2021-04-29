import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'core/hooks';
import {
  Modal,
  Paragraph,
  TextField,
  Button,
  Typography,
  Notification,
} from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createTeam } from '../services/TeamRepository';
import { captureError } from 'core/monitoring';
import { isTaken } from 'utils/ServerErrorUtils';
import * as Navigator from 'states/Navigator';

NewTeamDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired,
  allTeams: PropTypes.arrayOf(TeamPropType),
};

function createNewTeam({ name, description }, orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  return createTeam(endpoint, {
    name,
    description,
  });
}

export function NewTeamDialog({ isShown, onClose, allTeams, orgId }) {
  const { onChange, onSubmit, fields, form } = useForm({
    fields: {
      name: {
        value: '',
        required: true,
        validator: (value) => {
          const names = allTeams.map((team) => team.name);
          const nameAlreadyUsed = names.some((name) => name === value.trim());
          if (nameAlreadyUsed) {
            return 'This name is already in use';
          }
        },
      },
      description: {
        value: '',
        required: false,
      },
    },
    submitFn: async ({ name, description }, createFn) => {
      try {
        const newTeam = await createFn({ name, description }, orgId);
        onClose();
        Navigator.go({
          path: ['account', 'organizations', 'teams', 'detail'],
          params: { teamId: newTeam.sys.id },
        });
        Notification.success(`Team ${name} created successfully`);
      } catch (e) {
        if (isTaken(e)) {
          return {
            name: 'This name is already in use',
          };
        } else {
          Notification.error('Something went wrong. Could not create team');

          captureError(e);
        }
      }
    },
  });

  return (
    <Modal isShown={isShown} onClose={onClose} testId="new-team">
      {() => (
        <>
          <Modal.Header title={'New team'} onClose={onClose} />
          <Modal.Content>
            <Typography>
              <Paragraph>Teams make it easy to group people together.</Paragraph>
            </Typography>
            <TextField
              required
              name="name"
              id="team_name"
              testId="new-team.name"
              labelText="Team name"
              validationMessage={fields.name.error}
              value={fields.name.value}
              countCharacters
              textInputProps={{
                placeholder: 'The Mighty Ducks',
                maxLength: 120,
                autoFocus: true,
              }}
              onChange={(e) => onChange('name', e.target.value)}
            />
            <TextField
              name="teamDescription"
              id="team_description"
              testId="new-team.description"
              textarea
              labelText="Team description"
              validationMessage={fields.description.error}
              value={fields.description.value}
              countCharacters
              textInputProps={{
                placeholder: `A crew of misfit kids from Minnesota that stick together against all odds to turn their ragtag youth hockey team into regional champions.`,
                maxLength: 800,
                rows: 4,
              }}
              onChange={(e) => onChange('description', e.target.value)}
            />
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="primary"
              onClick={() => onSubmit(createNewTeam)}
              loading={form.isPending}
              testId="new-team.submit">
              Save
            </Button>
            <Button type="button" onClick={onClose} buttonType="muted" testId="new-team.cancel">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
