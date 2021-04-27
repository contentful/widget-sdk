import React from 'react';
import { SpaceEnvironmentsDeleteDialogContent } from './DeleteDialog';
import { act, fireEvent, render, screen } from '@testing-library/react';

describe('DeleteDialog', () => {
  describe('SpaceEnvironmentsDeleteDialogContent', () => {
    let inputValue;
    let confirmationId;
    let setInputValue;

    beforeEach(() => {
      inputValue = 'test';
      confirmationId = 'confirmation';
      setInputValue = jest.fn();
    });

    it('auto-focus on input', () => {
      render(
        <SpaceEnvironmentsDeleteDialogContent
          confirmationId={confirmationId}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      );

      expect(screen.queryByTestId('confirmId')).toEqual(document.activeElement);
    });

    it('changes input', () => {
      render(
        <SpaceEnvironmentsDeleteDialogContent
          confirmationId={confirmationId}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      );

      act(() => {
        fireEvent.change(screen.queryByTestId('confirmId'), {
          target: { value: 'delete me' },
        });
      });

      expect(setInputValue).toHaveBeenCalledWith('delete me');
    });
  });
});
