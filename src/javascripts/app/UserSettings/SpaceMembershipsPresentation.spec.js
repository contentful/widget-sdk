import React from 'react';
import { noop } from 'lodash';
import { cleanup, render, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';

import SpaceMembershipsPresentation from './SpaceMembershipsPresentation.es6';

const build = (props = {}) =>
  render(
    <SpaceMembershipsPresentation
      {...{
        onLeave: noop,
        spaces: [],
        ...props
      }}
    />
  );

describe('SpaceMembershipsPresentation', () => {
  afterEach(cleanup);

  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });
  });

  describe('rendered with 0 spaces', () => {
    const spaces = [];

    it('should render no rows', () => {
      const { queryAllByTestId } = build({ spaces });

      const rows = queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });
  });

  describe('rendered with 2 spaces', () => {
    const spaces = [
      {
        sys: { id: 'space1' },
        name: 'Space 1',
        organization: { name: 'Org A' },
        spaceMembership: undefined
      },
      {
        sys: { id: 'space2' },
        name: 'Space 2',
        organization: { name: 'Org A' },
        spaceMembership: { sys: { id: 'membership alpha' } }
      }
    ];
    let onLeave;

    beforeEach(() => {
      onLeave = jest.fn(noop);
    });

    it('should render two rows with details', () => {
      const { getAllByTestId } = build({ spaces });

      const rows = getAllByTestId('membership-row');
      expect(rows).toHaveLength(2);

      const spaceCells = getAllByTestId('space-cell');
      expect(spaceCells[0]).toHaveTextContent('Space 1');
      expect(spaceCells[1]).toHaveTextContent('Space 2');

      const organizationCells = getAllByTestId('organization-cell');
      expect(organizationCells[0]).toHaveTextContent('Org A');
      expect(organizationCells[1]).toHaveTextContent('Org A');

      const actionsCells = getAllByTestId('actions-cell');
      expect(actionsCells[0]).toHaveTextContent('Member via team');
      expect(actionsCells[1]).not.toHaveTextContent('Member via team');
    });

    it('should call `onLeave` when clicking leave button', () => {
      const { getByTestId } = build({ spaces, onLeave });

      fireEvent.click(getByTestId('action--leave-space'), {});
      expect(onLeave).toHaveBeenCalledWith(spaces[1]);
    });
  });
});
