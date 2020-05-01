import React from 'react';
import { noop } from 'lodash';
import { render, within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';
import * as fake from 'test/helpers/fakeFactory';

import SpaceMembershipsList from './SpaceMembershipsList';

const build = (props = {}) =>
  render(
    <SpaceMembershipsList
      {...{
        onLeave: noop,
        goToSpace: noop,
        spaces: [],
        ...props,
      }}
    />
  );

describe('SpaceMembershipsList', () => {
  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });
  });

  describe('rendered with 0 spaces', () => {
    const spaces = [];

    it('should render no rows', () => {
      build({ spaces });

      const rows = screen.queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });
  });

  describe('rendered with multiple spaces', () => {
    const spaces = [fake.Space({ spaceMembership: null }), fake.Space()];
    let onLeave;
    let goToSpace;

    beforeEach(() => {
      onLeave = jest.fn(noop);
      goToSpace = jest.fn(noop);
    });

    it('should render two rows with details', () => {
      build({ spaces });

      const rows = screen.getAllByTestId('membership-row');
      expect(rows).toHaveLength(2);

      const spaceCells = screen.getAllByTestId('space-cell');
      expect(spaceCells[0]).toHaveTextContent(spaces[0].name);
      expect(spaceCells[1]).toHaveTextContent(spaces[1].name);

      const organizationCells = screen.getAllByTestId('organization-cell');
      expect(organizationCells[0]).toHaveTextContent(spaces[0].organization.name);
      expect(organizationCells[1]).toHaveTextContent(spaces[1].organization.name);
    });

    it('should call `onLeave` when clicking leave button', async () => {
      build({ spaces, onLeave, goToSpace });

      // Trigger dropdown
      const secondRowOptionButton = screen.getAllByTestId(
        'organization-row.dropdown-menu.trigger'
      )[1];

      userEvent.click(secondRowOptionButton);

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.leave-space-button')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      expect(onLeave).toHaveBeenCalledWith(spaces[1]);
    });

    it('should not call `onLeave` when the user has access through a team', async () => {
      build({ spaces, onLeave, goToSpace });

      // Trigger dropdown
      const firstRowOptionButton = screen.getAllByTestId(
        'organization-row.dropdown-menu.trigger'
      )[0];

      userEvent.click(firstRowOptionButton);

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.leave-space-button')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      expect(onLeave).not.toHaveBeenCalled();
    });

    it('should call `goToSpace` when clicking goToSpace button', async () => {
      build({ spaces, onLeave, goToSpace });

      const firstRowOptionButton = screen.getAllByTestId(
        'organization-row.dropdown-menu.trigger'
      )[0];

      // Trigger dropdown
      userEvent.click(firstRowOptionButton);

      // Click on button within dropdown item div
      userEvent.click(
        within(screen.getByTestId('membership-row.go-to-space-link')).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        )
      );

      expect(goToSpace).toHaveBeenCalledWith(spaces[0]);
    });
  });
});
