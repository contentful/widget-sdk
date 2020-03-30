import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import BulkEntityEditorStatusDropdown from './BulkEntityEditorStatusDropdown';

describe('BulkEntityEditorStatusDropdown', () => {
  const props = {
    inProgress: false,
    state: 'published',
    stateLabel: 'published',
    allActions: []
  };
  const build = (localProps = {}) => {
    return render(<BulkEntityEditorStatusDropdown {...{ ...props, ...localProps }} />);
  };

  describe('with different states', () => {
    const states = [
      { state: 'published', stateLabel: 'published' },
      { state: 'draft', stateLabel: 'draft' },
      { state: 'changes', stateLabel: 'changed' },
      { state: 'archived', stateLabel: 'archived' }
    ];
    states.map(({ state, stateLabel }) => {
      it(`renders the correct label and style for ${state}`, () => {
        const localProps = { state, stateLabel };
        const result = build(localProps);
        expect(result.getByText(stateLabel)).toBeVisible();
      });
    });
  });

  describe('When a state change is not in progress', () => {
    it('does not render a loading spinner', () => {
      const localProps = { inProgress: false };
      const result = build(localProps);
      expect(result.queryByTestId('cf-ui-spinner')).toBeNull();
    });
  });

  describe('When a state change is in progress', () => {
    it('renders a loading spinner', () => {
      const localProps = { inProgress: true };
      const result = build(localProps);
      expect(result.getByTestId('cf-ui-spinner')).toBeVisible();
    });
  });

  describe('When the dropdown toggle is clicked', () => {
    it('Opens the dropdown', () => {
      const result = build();
      const trigger = result.getByTestId('bulk-entity-editor-status-dropdown-trigger');

      expect(result.queryByTestId('bulk-entity-editor-status-dropdown-menu')).toBeNull();
      fireEvent.click(trigger);
      expect(result.getByTestId('bulk-entity-editor-status-dropdown-menu')).toBeVisible();
    });
  });

  describe('When there are actions, and dropdown is open', () => {
    describe('when an action is clicked', () => {
      it('executes the associated action', () => {
        const allActions = [
          { execute: jest.fn(), label: 'action-label' },
          { execute: jest.fn(), label: 'another-label' }
        ];

        const localProps = { allActions };
        const result = build(localProps);

        const trigger = result.getByTestId('bulk-entity-editor-status-dropdown-trigger');

        fireEvent.click(trigger);

        fireEvent.click(result.getByText('action-label').closest('button'));

        expect(allActions[0].execute).toHaveBeenCalled();
        expect(allActions[1].execute).not.toHaveBeenCalled();
      });
    });
  });
});
