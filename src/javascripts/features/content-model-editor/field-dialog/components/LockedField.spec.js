import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LockedField } from './LockedField';
import { ModalLauncher } from '@contentful/forma-36-react-components';

describe('Locked Field', () => {
  const constProps = {
    testId: 'locked-field',
    labelText: 'Field ID',
    name: 'content-type-field-id',
    id: 'content-type-field-id',
  };
  it('sets disabled property from props', () => {
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={true}
        onChange={() => {}}
        validationMessage={''}
        {...constProps}
      />
    );
    expect(getByTestId('cf-ui-text-input').disabled).toBe(true);
  });
  it('calls "ModalLauncher.open" after clicking Lock Icon Button', async () => {
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={true}
        onChange={() => {}}
        validationMessage={''}
        {...constProps}
      />
    );

    userEvent.click(getByTestId('unlock-icon-button'));
    wait(() => expect(ModalLauncher.open).toHaveBeenCalled());
  });
  it('calls "onChange" function on field change', () => {
    const onChangeMock = jest.fn();
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={false}
        onChange={onChangeMock}
        validationMessage={''}
        {...constProps}
      />
    );

    fireEvent.change(getByTestId('cf-ui-text-input'), { target: { value: 'newValue' } });
    expect(onChangeMock).toHaveBeenCalledWith('newValue');
  });
});
