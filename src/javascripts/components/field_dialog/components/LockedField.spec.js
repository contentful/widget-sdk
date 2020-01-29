import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import LockedField from './LockedField';

describe('Locked Field', () => {
  const constProps = {
    testId: 'locked-field',
    labelText: 'Field ID',
    name: 'content-type-field-id',
    id: 'content-type-field-id'
  };
  it('sets disabled property from props', () => {
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={true}
        setValue={() => {}}
        onUnlock={() => {}}
        validationMessage={''}
        {...constProps}
      />
    );
    expect(getByTestId('cf-ui-text-input').disabled).toBe(true);
  });
  it('calls "onUnlock" function after clicking Lock Icon Button', () => {
    const onUnlockMock = jest.fn();
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={true}
        setValue={() => {}}
        onUnlock={onUnlockMock}
        validationMessage={''}
        {...constProps}
      />
    );

    fireEvent.click(getByTestId('unlock-icon-button'));
    expect(onUnlockMock).toHaveBeenCalled();
  });
  it('calls "setValue" function on field change', () => {
    const setValueMock = jest.fn();
    const { getByTestId } = render(
      <LockedField
        value="value"
        isDisabled={false}
        setValue={setValueMock}
        onUnlock={() => {}}
        validationMessage={''}
        {...constProps}
      />
    );

    fireEvent.change(getByTestId('cf-ui-text-input'), { target: { value: 'newValue' } });
    expect(setValueMock).toHaveBeenCalledWith('newValue');
  });
});
