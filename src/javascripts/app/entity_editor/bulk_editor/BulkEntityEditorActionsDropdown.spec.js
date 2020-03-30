import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import BulkEntityEditorActionsDropdown from './BulkEntityEditorActionsDropdown';
import * as Navigator from 'states/Navigator';

const stateRef = Navigator.makeEntityRef({
  sys: {
    id: 'fakeId',
    type: 'Entry',
    environment: {
      sys: {
        id: 'anotherFakeId',
        isMasterEnvironment: true
      }
    },
    space: {
      sys: { id: 'anotherAnotherFakeId' }
    }
  }
});
const props = { unlink: jest.fn(), openInEntryEditor: jest.fn(), stateRef };
const build = (localProps = {}) => {
  return render(<BulkEntityEditorActionsDropdown {...{ ...props, ...localProps }} />);
};

describe('BulkEntityEditorActionsDropdown', () => {
  describe('When the dropdown toggle is clicked', () => {
    it('Opens the dropdown', () => {
      const result = build();
      const trigger = result.getByTestId('bulk-editor-actions-dropdown-trigger');

      expect(result.queryByTestId('bulk-editor-actions-dropdown-menu')).toBeNull();
      fireEvent.click(trigger);
      expect(result.getByTestId('bulk-editor-actions-dropdown-menu')).toBeVisible();
    });
  });

  describe('When the dropdown is open', () => {
    describe("and 'Edit entry in new tab' is clicked", () => {
      let result;
      beforeEach(() => {
        result = build();
        const trigger = result.getByTestId('bulk-editor-actions-dropdown-trigger');

        fireEvent.click(trigger);

        fireEvent.click(result.getByText('Edit entry in new tab'));
      });

      it('calls the passed in function', () => {
        expect(props.openInEntryEditor).toHaveBeenCalled();
      });

      it('navigates', () => {
        // I'm not totally sure how to test this navigation so
        // for now let's just check that the link is structured correctly
        const link = result.getByText('Edit entry in new tab').closest('a');
        expect(link).toHaveAttribute('href', Navigator.href(stateRef));
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    describe("and 'Unlink entry' is clicked", () => {
      it('calls the passed in function', () => {
        const result = build();
        const trigger = result.getByTestId('bulk-editor-actions-dropdown-trigger');

        fireEvent.click(trigger);

        fireEvent.click(result.getByText('Unlink entry'));

        expect(props.unlink).toHaveBeenCalled();
      });
    });

    describe('and the toggle is clicked again', () => {
      it('closes the dropdown', () => {
        const result = build();
        const trigger = result.getByTestId('bulk-editor-actions-dropdown-trigger');
        fireEvent.click(trigger);
        expect(result.getByTestId('bulk-editor-actions-dropdown-menu')).toBeVisible();
        fireEvent.click(trigger);
        expect(result.queryByTestId('bulk-editor-actions-dropdown-menu')).toBeNull();
      });
    });
  });
});
