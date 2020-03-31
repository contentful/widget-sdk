import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import DeleteButton from './DeleteButton';

const props = { count: 1, deleteSelected: jest.fn(), shouldShow: true };
const build = (localProps = {}) => render(<DeleteButton {...{ ...props, ...localProps }} />);

describe('Asset List DeleteButton component', () => {
  describe('When should show is false', () => {
    it('renders nothing', () => {
      const result = build({ shouldShow: false });
      expect(result.container).toBeEmpty();
      // TODO: when we change the asset_list template file from Angular to React it
      // would be nice to move this functionality out of the component and into
      // the template
    });
  });

  describe('When should show is true', () => {
    describe('When the delete button is clicked', () => {
      it('displays a confirmation dropdown', () => {
        const result = build();
        fireEvent.click(result.getByText('Delete'));

        expect(result.getByText('You are about to permanently delete')).toBeVisible();
      });

      describe('when cancel is clicked', () => {
        it('closes the confirmation dropdown', () => {
          const result = build();
          fireEvent.click(result.getByText('Delete'));

          fireEvent.click(result.getByText('Cancel'));
          expect(result.queryByText('You are about to permanently delete')).toBeNull();
        });
      });

      describe('when the delete button is clicked again', () => {
        it('closes the confirmation dropdown', () => {
          const result = build();
          fireEvent.click(result.getByText('Delete'));

          fireEvent.click(result.getByText('Delete'));
          expect(result.queryByText('You are about to permanently delete')).toBeNull();
        });
      });

      describe('when the confirm button is clicked', () => {
        it('calls deleteSelected', () => {
          const result = build();
          fireEvent.click(result.getByText('Delete'));
          fireEvent.click(result.getByText('Permanently delete'));
          expect(props.deleteSelected).toHaveBeenCalled();
        });
      });
    });
  });
});
