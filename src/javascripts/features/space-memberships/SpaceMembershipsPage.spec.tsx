import React from 'react';
import { render, screen, wait, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';
import { create } from 'access_control/SpaceMembershipRepository';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpaces } from 'services/TokenStore';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { MemoryRouter, router } from 'core/react-routing';
import * as fake from 'test/helpers/fakeFactory';

import { SpaceMembershipsPage } from './SpaceMembershipsPage';

jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  create: jest.fn(),
}));

jest.mock('data/EndpointFactory', () => ({
  createSpaceEndpoint: jest.fn(),
}));

jest.mock('core/react-routing', () => ({
  // @ts-expect-error mute in tests
  ...jest.requireActual('core/react-routing'),
  useSearchParams: jest.fn().mockReturnValue([new URLSearchParams()]),
  router: {
    navigate: jest.fn(),
  },
}));

const remove = jest.fn();

const build = async () => {
  render(
    <MemoryRouter>
      <SpaceMembershipsPage />
    </MemoryRouter>
  );

  return wait();
};

describe('SpaceMembershipsPage', () => {
  describe('being rendered', () => {
    it('should not break', async () => {
      await expect(build()).resolves.not.toThrow();
    });
  });

  describe('rendered with 2 spaces', () => {
    const spaces = [fake.Space({ spaceMembership: null }), fake.Space()];
    const createdEndpoint = { example: 'test' };

    beforeEach(() => {
      (getSpaces as jest.Mock).mockResolvedValue(spaces);
      (createSpaceEndpoint as jest.Mock).mockReturnValue(createdEndpoint);
      (create as jest.Mock).mockReturnValue({ remove });
    });

    it('should call `onLeave` when clicking leave button', async () => {
      await build();

      // Trigger dropdown
      userEvent.click(screen.getAllByTestId('organization-row.dropdown-menu.trigger')[1]);

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.leave-space-button')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      await wait();

      expect(createSpaceEndpoint).toHaveBeenCalledWith(spaces[1].sys.id);
      expect(create).toHaveBeenCalledWith(createdEndpoint);
      expect(remove).toHaveBeenCalledWith(spaces[1].spaceMembership);

      const rows = screen.getAllByTestId('membership-row');
      expect(rows).toHaveLength(1);
    });

    it('should not call `onLeave` when the user has access through a team', async () => {
      await build();

      // Trigger dropdown
      userEvent.click(screen.getAllByTestId('organization-row.dropdown-menu.trigger')[1]);

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.leave-space-button')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      await wait();

      expect(createSpaceEndpoint).toHaveBeenCalledWith(spaces[1].sys.id);
      expect(create).toHaveBeenCalledWith(createdEndpoint);
      expect(remove).toHaveBeenCalledWith(spaces[1].spaceMembership);

      const rows = screen.getAllByTestId('membership-row');
      expect(rows).toHaveLength(1);
    });

    it('should call `goToSpace` when clicking goToSpace button', async () => {
      await build();

      const rows = screen.getAllByTestId('membership-row');

      // Trigger dropdown in 2nd space
      userEvent.click(within(rows[1]).getByTestId('organization-row.dropdown-menu.trigger'));

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.go-to-space-link')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        spaceId: spaces[1].sys.id,
      });
    });

    it('should display when the user has access to the space through a team', async () => {
      await build();

      const rows = screen.getAllByTestId('membership-row');

      // Trigger dropdown in 2nd space
      userEvent.click(within(rows[0]).getByTestId('organization-row.dropdown-menu.trigger'));

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.go-to-space-link')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        spaceId: spaces[0].sys.id,
      });
    });
  });
});