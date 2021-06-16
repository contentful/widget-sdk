import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewTeamDialog } from './NewTeamDialog';
import { Team } from 'test/helpers/fakeFactory';
import userEvent from '@testing-library/user-event';

import { createTeam } from '../services/TeamRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { mockOrganizationEndpoint } from '__mocks__/data/EndpointFactory';
import { Notification } from '@contentful/forma-36-react-components';

const onCloseFn = jest.fn();
const teamA = Team('Team A');
const mockNewTeam = Team('Team B');

jest.mock('../services/TeamRepository', () => ({
  createTeam: jest.fn(async () => mockNewTeam),
}));

describe('NewTeamDialog', () => {
  let nameField, descriptionField, submitButton, cancelButton;

  beforeEach(() => {
    render(<NewTeamDialog onClose={onCloseFn} allTeams={[teamA]} orgId="orgid" isShown={true} />);
    nameField = screen.getByTestId('new-team.name').querySelector('input');
    descriptionField = screen.getByLabelText('Team description');
    submitButton = screen.getByTestId('new-team.submit');
    cancelButton = screen.getByTestId('new-team.cancel');
  });

  afterEach(Notification.closeAll);

  it('creates a new team', async () => {
    userEvent.type(nameField, 'Team B');
    userEvent.type(descriptionField, 'Not Team A');
    fireEvent.click(submitButton);

    expect(createOrganizationEndpoint).toHaveBeenCalledWith('orgid');
    expect(createTeam).toHaveBeenCalledWith(mockOrganizationEndpoint, {
      name: 'Team B',
      description: 'Not Team A',
    });
    await screen.findByText('Team Team B created successfully');
    expect(onCloseFn).toHaveBeenCalled();
  });

  it('closes the modal when clicking on the Cancel button', () => {
    fireEvent.click(cancelButton);
    expect(createTeam).not.toHaveBeenCalled();
    expect(onCloseFn).toHaveBeenCalled();
  });

  it('does not submit if team name is already in use', async () => {
    userEvent.type(nameField, 'Team A');
    userEvent.type(descriptionField, 'Another A?');
    fireEvent.click(submitButton);

    expect(createTeam).not.toHaveBeenCalled();

    await screen.findByText('This name is already in use');
  });

  it('displays a conflict error coming from the API', async () => {
    createTeam.mockRejectedValueOnce({
      statusCode: 422,
      data: { details: { errors: [{ name: 'taken' }] } },
    });
    userEvent.type(nameField, 'Team C');
    fireEvent.click(submitButton);
    expect(createTeam).toHaveBeenCalledWith(mockOrganizationEndpoint, {
      name: 'Team C',
      description: '',
    });
    await screen.findByText('This name is already in use');
  });

  it('displays generic server errors coming from the API', async () => {
    createTeam.mockRejectedValueOnce(new Error('Generic error'));
    userEvent.type(nameField, 'Team C');
    fireEvent.click(submitButton);

    await screen.findByText('Something went wrong. Could not create team');
  });
});
