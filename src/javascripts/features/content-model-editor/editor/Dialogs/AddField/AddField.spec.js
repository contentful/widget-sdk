import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { AddFieldDialogModal } from './AddField';

describe('AddFieldDialogModal', () => {
  const props = {
    isShown: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    onConfirmAndConfigure: jest.fn(),
    existingApiNames: ['existingApiName'],
  };
  const build = (localProps = {}) => {
    return render(<AddFieldDialogModal {...{ ...props, ...localProps }} />);
  };

  describe('When isShown is false', () => {
    const result = build({ isShown: false });
    expect(result.queryByTestId('add_field_dialog_modal')).toBeNull();
  });

  describe('When isShown is true', () => {
    let result;
    beforeEach(() => {
      result = build({ isShown: true });
    });

    it('renders the modal', () => {
      expect(result.getByTestId('add_field_dialog_modal')).toBeVisible();
    });

    it('renders the FieldGroupSelector', () => {
      expect(result.getAllByTestId('select-field')).toHaveLength(9);
    });

    describe('When a field group is selected', () => {
      beforeEach(() => {
        fireEvent.click(result.getByText('Text'));
      });

      it('transitions to the field group configuration screen', () => {
        expect(result.getByTestId('field_group_configuration')).toBeVisible();
      });

      describe("When the 'change field type' button is pressed", () => {
        it('returns to the fieldGroupSelection dialog', () => {
          fireEvent.click(result.getByText('Change field type'));
          expect(result.getAllByTestId('select-field')).toHaveLength(9);
        });
      });

      describe("When the 'Create' button is pressed", () => {
        describe('Without a the form being filled', () => {
          it("Shows errors, and doesn't call on confirm", () => {
            fireEvent.click(result.getByText('Create'));
            expect(props.onConfirm).not.toHaveBeenCalled();
            expect(result.getAllByText('This field is required')).toHaveLength(2);
          });
        });

        describe('When the form has been filled with a bad APIName', () => {
          const badNames = [
            { name: '2cool', error: 'Please use a letter as the first character' },
            { name: 'too many spaces', error: 'Please use only letters and numbers' },
            { name: 'existingApiName', error: 'A field with this ID already exists' },
          ];

          badNames.map(({ name, error }) => {
            it(`Shows ${error} with ${name}, and doesn't call on confirm`, () => {
              const nameInput = result.getByLabelText('Name');
              const apiInput = result.getByLabelText('Field ID');
              fireEvent.change(nameInput, { target: { value: 'aValidName' } });
              fireEvent.change(apiInput, { target: { value: name } });

              fireEvent.click(result.getByText('Create'));
              expect(props.onConfirm).not.toHaveBeenCalled();
              expect(result.getByText(error)).toBeVisible();
            });
          });
        });

        describe('and the form is filled correctly', () => {
          it('Calls confirm with the field details', async () => {
            const input = result.getByLabelText('Name');
            fireEvent.change(input, { target: { value: 'MyExcellentField' } });
            fireEvent.click(result.getByText('Create'));
            await wait(() => {
              if (props.onClose.mock.calls.length === 0) {
                throw new Error();
              }
            });
            expect(props.onConfirm).toHaveBeenCalledWith({
              apiName: 'myExcellentField',
              name: 'MyExcellentField',
              type: 'Symbol',
              id: expect.any(String),
            });
            expect(props.onClose).toHaveBeenCalled();
          });
        });

        describe('and the form is filled correctly, as a list', () => {
          it('Calls confirm with the field details', async () => {
            const input = result.getByLabelText('Name');
            fireEvent.change(input, { target: { value: 'MyExcellentField' } });
            fireEvent.click(result.getByLabelText('List'));

            await wait(() => {
              if (result.getByLabelText('List').checked === false) {
                throw new Error();
              }
            });

            fireEvent.click(result.getByText('Create'));
            await wait(() => {
              if (props.onClose.mock.calls.length === 0) {
                throw new Error();
              }
            });
            expect(props.onConfirm).toHaveBeenCalledWith({
              apiName: 'myExcellentField',
              name: 'MyExcellentField',
              type: 'Array',
              items: {
                type: 'Symbol',
              },
              id: expect.any(String),
            });
            expect(props.onClose).toHaveBeenCalled();
          });
        });
      });

      describe("When the 'Create and configure' button is pressed", () => {
        describe('Without a the form being filled', () => {
          it("Shows errors, and doesn't call on confirm", () => {
            fireEvent.click(result.getByText('Create and configure'));
            expect(props.onConfirm).not.toHaveBeenCalled();
          });
        });
        describe('and the form is filled', () => {
          it('Calls confirmAndConfigure with the field details', async () => {
            const input = result.getByLabelText('Name');
            fireEvent.change(input, { target: { value: 'myReallyNiceField' } });
            fireEvent.click(result.getByText('Create and configure'));

            await wait(() => {
              if (props.onClose.mock.calls.length === 0) {
                throw new Error();
              }
            });

            expect(props.onConfirmAndConfigure).toHaveBeenCalledWith({
              apiName: 'myReallyNiceField',
              name: 'myReallyNiceField',
              type: 'Symbol',
              id: expect.any(String),
            });
            expect(props.onClose).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
