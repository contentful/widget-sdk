import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import LocaleRemovalConfirmDialog from './LocaleRemovalConfirmDialog.es6';

describe('locales/components/LocaleRemovalConfirmDialog', () => {
  afterEach(cleanup);

  const renderComponent = props =>
    render(
      <LocaleRemovalConfirmDialog
        isShown
        onConfirm={() => {}}
        onCancel={() => {}}
        locale={{
          name: 'English',
          code: 'uk'
        }}
        {...props}
      />
    );

  it('confirm button should be disabled by default', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('delete-locale-confirm')).toBeDisabled();
  });

  it('it is possible to invoke cancel by clicking on two buttons', () => {
    const stubs = {
      onCancel: jest.fn()
    };
    const { getByTestId } = renderComponent({
      onCancel: stubs.onCancel
    });

    fireEvent.click(getByTestId('delete-locale-cancel'));

    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button should be enabled when user types locale code in input', () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn()
    };

    const { getByTestId } = renderComponent({
      ...stubs
    });

    const deleteButton = getByTestId('delete-locale-confirm');
    const repeatLocaleInput = getByTestId('repeat-locale-input');

    fireEvent.change(repeatLocaleInput, { target: { value: 'uk' } });

    expect(deleteButton).not.toBeDisabled();
    fireEvent.click(deleteButton);

    fireEvent.change(repeatLocaleInput, { target: { value: 'something' } });

    expect(deleteButton).toBeDisabled();

    fireEvent.click(deleteButton);

    expect(stubs.onConfirm).toHaveBeenCalledTimes(1);
  });
});
