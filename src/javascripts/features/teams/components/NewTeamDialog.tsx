import React from 'react';
import { useForm } from 'core/hooks';
import {
  Button,
  Modal,
  Notification,
  Paragraph,
  TextField,
  Typography,
} from '@contentful/forma-36-react-components';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createTeam } from '../services/TeamRepository';
import { captureError } from 'core/monitoring';
import { isTaken } from 'utils/ServerErrorUtils';
import { router } from 'core/react-routing';
import { Team } from '../types';

function createNewTeam(
  { name, description }: { name: string; description: string },
  orgId: string
) {
  const endpoint = createOrganizationEndpoint(orgId);
  return createTeam(endpoint, { name, description });
}

type Props = {
  orgId: string;
  isShown: boolean;
  onClose: VoidFunction;
  allTeams: Team[];
};

export function NewTeamDialog({ isShown, onClose, allTeams, orgId }: Props) {
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
        router.navigate({ path: 'organizations.teams.detail', orgId, teamId: newTeam.sys.id });
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
              onChange={(e) => onChange('name', e.currentTarget.value)}
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
              onChange={(e) => onChange('description', e.currentTarget.value)}
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
