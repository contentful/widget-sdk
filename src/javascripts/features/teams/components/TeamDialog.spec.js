import React from 'react';
import { render, screen, fireEvent, wait } from '@testing-library/react';

import { TeamDialog } from './TeamDialog';

const mockOrgEndpoint = jest.fn();

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(() => mockOrgEndpoint),
}));

jest.mock('features/teams/services/TeamRepository', () => ({
  updateTeam: jest.fn(),
}));

describe('TeamDialog', () => {
  const props = {
    isShown: true,
    onClose: jest.fn(),
    updateTeamDetailsValues: jest.fn(),
    initialTeam: {
      name: 'A Team',
      description: 'a description',
      sys: { id: 'aTeam', organization: { sys: { id: 'aTeam1' } } },
    },
    allTeams: [
      {
        name: 'A Team',
        description: 'a description',
        sys: { id: 'aTeam' },
      },
      {
        name: 'A Team 1',
        description: 'a description',
        sys: { id: 'aTeam1' },
      },
      {
        name: 'A Team 2',
        description: 'a description',
        sys: { id: 'aTeam2' },
      },
    ],
  };

  function build() {
    render(<TeamDialog {...props} />);
    return wait();
  }

  describe('team dialog when isShown is true', () => {
    beforeEach(async () => {
      await build({ isShown: true });
    });

    it('renders the dialog', () => {
      expect(screen.getByTestId('team-edit-dialog')).toBeVisible();
    });

    it('renders the dialog text input and description with value from props', () => {
      const dialogInput = screen.getByTestId('team-name-input');
      const dialogDescription = screen.getByTestId('team-name-description');
      const dialogTeamNameInput = dialogInput.querySelector('input');
      const dialogTeamNameDescription = dialogDescription.querySelector('textarea');

      expect(dialogTeamNameInput.value).toBe(props.initialTeam.name);
      expect(dialogTeamNameDescription.value).toBe(props.initialTeam.description);
    });

    it('changes values in the form element and submit', async () => {
      const changedValues = {
        input: 'A Team changed',
        textarea: 'A Team desc changed',
      };

      const dialogInput = screen.getByTestId('team-name-input');
      const dialogDescription = screen.getByTestId('team-name-description');
      const dialogTeamNameInput = dialogInput.querySelector('input');
      const dialogTeamNameDescription = dialogDescription.querySelector('textarea');

      fireEvent.change(dialogTeamNameInput, { target: { value: changedValues.input } });
      fireEvent.change(dialogTeamNameDescription, { target: { value: changedValues.textarea } });

      const submitButton = screen.getByTestId('save-team-button');
      expect(submitButton).toBeInTheDocument();
      fireEvent.click(submitButton);

      expect(props.onClose).toHaveBeenCalledTimes(1);
      wait(() =>
        expect(props.updateTeamDetailsValues).toHaveBeenCalledWith({
          name: changedValues.input,
          description: changedValues.textarea,
        })
      );
    });
  });
});
