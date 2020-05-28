import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fakeFactory from 'test/helpers/fakeFactory';

import { DeleteTeamDialog } from './DeleteTeamDialog';
import { removeTeam } from '../services/TeamRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

jest.mock('../services/TeamRepository', () => ({
  removeTeam: jest.fn(),
}));

const mockedEndpoint = createOrganizationEndpoint('orgId');

describe('DeleteTeamDialog', () => {
  const props = {
    isShown: true,
    onClose: jest.fn(),
    initialTeam: fakeFactory.Team('A Team'),
  };

  function build(localProps = {}) {
    render(<DeleteTeamDialog {...{ ...props, ...localProps }} />);
  }

  describe('team dialog when isShown is true', () => {
    beforeEach(async () => {
      await build({ isShown: true });
    });

    it('renders the dialog', () => {
      expect(screen.getByTestId('remove-team-dialog')).toBeVisible();
    });

    it('click delete and on display success notification', async () => {
      const submitButton = screen.getByTestId('remove-team-button');
      expect(submitButton).toBeInTheDocument();
      fireEvent.click(submitButton);

      const successNotification = await screen.findByTestId('cf-ui-notification');
      expect(successNotification).toHaveTextContent('Successfully removed team A Team');

      expect(removeTeam).toHaveBeenCalledTimes(1);
      expect(removeTeam).toHaveBeenCalledWith(mockedEndpoint, props.initialTeam.sys.id);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('click close button and call onClose', () => {
      const closeButton = screen.getByTestId('close-delete-team-dialog-button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
